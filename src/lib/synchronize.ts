import { ChangeStreamDocument } from 'mongodb';
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

		// start synchronizing MongoDB with ElasticSearch and watching changes for each collection
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
		// if pipeline is determined
		switch (changeEvent.operationType) {
			case 'insert':
			case 'update':
			case 'delete':
				const pipeline = this.mongoDbClient.getPipeline(changeEvent.ns.coll);
				if (pipeline) {
					return await this.elasticClient.aggregate(changeEvent, this.mongoDbClient.getDb(), pipeline);
				}
				break;
			default:
				break;
		}

		// if pipeline is not determined
		switch (changeEvent.operationType) {
			case 'insert': {
				return await this.elasticClient.insert(changeEvent);
			}
			case 'update': {
				return await this.elasticClient.update(changeEvent, this.mongoDbClient.getDb());
			}
			case 'delete': {
				return await this.elasticClient.delete(changeEvent);
			}
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
