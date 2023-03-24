import { CreateRequest } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamDocument, ChangeStreamInsertDocument } from 'mongodb';
import { ElasticClient } from './elastic-client';
import { ElasticOptions, MongoOptions } from './interfaces';
import { MongoDbClient } from './mongodb-client';

export class SyncMongoDbWithElasticSearch {
	mongodbClient: MongoDbClient;
	elasticClient: ElasticClient;

	constructor(mongoOptions: MongoOptions, elasticOptions: ElasticOptions) {
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
				this.updateTarget(changeEvent);
			});
		}
	}

	private updateTarget(changeEvent: ChangeStreamDocument) {
		switch (changeEvent.operationType) {
			case 'insert':
				this.createDocumentAtTarget(changeEvent);
				break;

			default:
				break;
		}
	}

	private createDocumentAtTarget(changeEvent: ChangeStreamInsertDocument) {
		const createRequest: CreateRequest = {
			id: changeEvent.fullDocument._id,
			index: changeEvent.ns.coll,
			document: changeEvent.fullDocument,
		};
		this.elasticClient.client.create(createRequest);
	}
}
