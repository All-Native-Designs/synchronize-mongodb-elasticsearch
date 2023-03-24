import { CanNotCreateMongoClientException, CollectionNotFoundException, VariableNotSetException } from './errors';
import { MongoOptions } from './interfaces';
import { MongoClient, Db, ChangeStream, ChangeStreamDocument, Collection } from 'mongodb';

export class MongoDbClient {
	private mongoOptions: MongoOptions;
	client!: MongoClient;
	private db!: Db;

	constructor(mongoOptions: MongoOptions) {
		this.checkOptions(mongoOptions);
		this.mongoOptions = mongoOptions;
	}

	private checkOptions(options: MongoOptions) {
		if (options.uri.length === 0) throw new VariableNotSetException('MongoDb uri');
		if (options.dbName.length === 0) throw new VariableNotSetException('MongoDb database name');
	}

	private getMongoClient() {
		try {
			// const url = 'mongodb://localhost:37017,localhost:37018,localhost:37019/?replicaSet=rs0';
			const client = new MongoClient(this.mongoOptions.uri);
			return client;
		} catch (error) {
			throw new CanNotCreateMongoClientException();
		}
	}

	async createConnection() {
		const client = this.getMongoClient();
		this.client = await client.connect();
		this.db = client.db(this.mongoOptions.dbName);
	}

	getCollectionsStream(): ChangeStream[] {
		const collectionNames = this.mongoOptions.collections;
		const collectionsChangeStream: ChangeStream[] = [];
		if (collectionNames && collectionNames.length > 0) {
			collectionsChangeStream.push(...this.getCollectionsChangeStream(collectionNames));
		}
		return collectionsChangeStream;
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
}
