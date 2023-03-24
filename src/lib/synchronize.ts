import {
	MongoClient,
	Db,
	ChangeStream,
	ChangeStreamDocument,
	Collection,
	ChangeStreamInsertDocument,
	ChangeStreamCreateDocument,
} from 'mongodb';
import { CanNotCreateMongoClientException, CollectionNotFoundException, VariableNotSetException } from './errors';
import { ElasticOptions, MongoOptions } from './interfaces';
import { ElasticClient } from './elastic-client';
import { MongoDbClient } from './mongodb-client';
import { CreateRequest } from '@elastic/elasticsearch/lib/api/types';

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
		this.elasticClient.createConnection();

		// {
		// 	_id: {
		// 	  _data: '82641D49A2000000012B022C0100296E5A10045945F9D8724A4984A1F0D65B4B8FA02B46645F69640064641D49A2717B4DD968E146170004'
		// 	},
		// 	operationType: 'insert',
		// 	clusterTime: new Timestamp({ t: 1679640994, i: 1 }),
		// 	wallTime: 2023-03-24T06:56:34.188Z,
		// 	fullDocument: {
		// 	  _id: new ObjectId("641d49a2717b4dd968e14617"),
		// 	  name: 'test7',
		// 	  language: 'en'
		// 	},
		// 	ns: { db: 'sp-production', coll: 'standardname-synonyms' },
		// 	documentKey: { _id: new ObjectId("641d49a2717b4dd968e14617") }
		// }
		const collectionsChangeStream = this.mongodbClient.getCollectionsStream();
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
