import { ChangeStreamDocument } from 'mongodb';
import { Delete, Insert, Update } from './elastic';
import { ElasticClient } from './elastic/elastic-client';
import { MongoDbClient } from './mongodb/mongodb-client';
import { ElasticOptions, ElasticQueryResult, MongoDbOptions } from './types';

export class SyncMongoDbWithElasticSearch {
	mongoDbClient: MongoDbClient;
	elasticClient: ElasticClient;
	changeEvents: ChangeStreamDocument[] = [];

	constructor(mongoDbOptions: MongoDbOptions, elasticOptions: ElasticOptions) {
		this.mongoDbClient = new MongoDbClient(mongoDbOptions);
		this.elasticClient = new ElasticClient(elasticOptions);
	}

	async start() {
		// create mongodb connection
		await this.mongoDbClient.createConnection();

		// create elastic search client
		this.elasticClient.createConnection();

		// get change stream of database collections
		const collectionsChangeStream = this.mongoDbClient.getCollectionsStream();

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
				return await Insert.handle(changeEvent, this.elasticClient);
			case 'update':
				return await Update.handle(changeEvent, this.mongoDbClient, this.elasticClient);
			case 'delete':
				return await Delete.handle(changeEvent, this.elasticClient);
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
