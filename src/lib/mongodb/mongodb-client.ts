import { ChangeStream, Db, MongoClient } from 'mongodb';
import {
	CanNotCreateMongoClientException,
	CollectionNotFoundException,
	VariableNotSetException,
} from '../errors/errors';
import { MongoDbOptions } from '../types/mongo.type';

export class MongoDbClient {
	private mongoDbOptions: MongoDbOptions;
	client!: MongoClient;
	private db!: Db;

	constructor(mongoDbOptions: MongoDbOptions) {
		this.checkOptions(mongoDbOptions);
		this.mongoDbOptions = mongoDbOptions;
	}

	private checkOptions(mongoDbOptions: MongoDbOptions) {
		if (mongoDbOptions.uri.length === 0) throw new VariableNotSetException('MongoDb uri');
		if (mongoDbOptions.dbName.length === 0) throw new VariableNotSetException('MongoDb database name');
	}

	private getMongoClient() {
		try {
			const client = new MongoClient(this.mongoDbOptions.uri);
			return client;
		} catch (error) {
			throw new CanNotCreateMongoClientException();
		}
	}

	async createConnection() {
		const client = this.getMongoClient();
		this.client = await client.connect();
		this.db = client.db(this.mongoDbOptions.dbName);
	}

	getDb() {
		return this.db;
	}

	getCollectionsStream(): ChangeStream[] {
		const collectionNames = this.mongoDbOptions.collections;
		const collectionsChangeStream: ChangeStream[] = [];
		if (collectionNames && collectionNames.length > 0) {
			collectionsChangeStream.push(...this.getCollectionsChangeStream(collectionNames.map((coll) => coll.name)));
		}
		return collectionsChangeStream;
	}

	get collections() {
		return this.mongoDbOptions.collections;
	}

	get batchSize() {
		return this.mongoDbOptions.batchSize;
	}

	private getCollectionsChangeStream(collectionNames: string[]) {
		const collectionsChangeStream: ChangeStream[] = [];
		for (const collectionName of collectionNames) {
			const collection = this.db.collection(collectionName);
			if (!collection) {
				throw new CollectionNotFoundException(collectionName);
			}
			collectionsChangeStream.push(collection.watch());
		}
		return collectionsChangeStream;
	}

	getPipeline(collection: string) {
		const collPipeline = this.mongoDbOptions.collections?.find((coll) => coll.name === collection);
		return collPipeline?.pipeline;
	}
}
