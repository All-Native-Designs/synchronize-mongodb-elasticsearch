import { ChangeStreamDocument } from 'mongodb';
import { CreateElastic, DeleteElastic, UpdateElastic } from './elastic/api';
import { ElasticClient } from './elastic/elastic-client';
import { MongoDbClient } from './mongo/mongodb-client';
import { ElasticOptions, ElasticQueryResult, MongoDbOptions } from './types/api';

export class SyncMongoDbWithElasticSearch {
	mongodbClient: MongoDbClient;
	elasticClient: ElasticClient;
	changeEvents: ChangeStreamDocument[] = [];

	constructor(mongoOptions: MongoDbOptions, elasticOptions: ElasticOptions) {
		this.mongodbClient = new MongoDbClient(mongoOptions);
		this.elasticClient = new ElasticClient(elasticOptions);
	}

	async start() {
		// create mongodb connection
		await this.mongodbClient.createConnection();

		// create elastic search client
		this.elasticClient.createConnection();

		// get change stream of database collections
		const collectionsChangeStream = this.mongodbClient.getCollectionsStream();

		// start watching on changes for each collection
		for (const collectionChangeStream of collectionsChangeStream) {
			collectionChangeStream.on('change', (changeEvent) => {
				this.manageEvents(changeEvent);
			});
		}
	}

	private async manageEvents(changeEvent: ChangeStreamDocument) {
		this.changeEvents.push(changeEvent);
		while (this.changeEvents.length > 0) {
			const result = await this.syncWithElastic(this.changeEvents[0]);
			this.handleResult(result);
		}
	}

	/**
	 * TODO: implement other operation types
	 * @param changeEvent
	 * @returns
	 */
	private async syncWithElastic(changeEvent: ChangeStreamDocument): Promise<ElasticQueryResult> {
		switch (changeEvent.operationType) {
			case 'insert':
				const createElastic = new CreateElastic(this.elasticClient);
				return await createElastic.handle(changeEvent);
			case 'update':
				const updateElastic = new UpdateElastic(this.mongodbClient, this.elasticClient);
				return await updateElastic.handle(changeEvent);
			case 'delete':
				const deleteElastic = new DeleteElastic(this.elasticClient);
				return await deleteElastic.handle(changeEvent);
			default:
				break;
		}
		return {
			ok: false,
		};
	}

	private handleResult(result: ElasticQueryResult) {
		if (result?.ok) {
			this.changeEvents.shift();
		}
	}
}
