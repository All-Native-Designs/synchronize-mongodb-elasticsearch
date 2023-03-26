import { Client } from '@elastic/elasticsearch';
import {
	ChangeStreamDeleteDocument,
	ChangeStreamInsertDocument,
	ChangeStreamUpdateDocument,
	Db,
	Document,
} from 'mongodb';
import { VariableNotSetException } from '../errors/errors';
import { MongoDbClient } from '../mongodb';
import { ElasticOptions } from '../types';
import { Delete } from './delete';
import { Insert } from './insert';
import { Update } from './update';
import { Aggregate } from './aggregate';

export class ElasticClient {
	private elasticOptions: ElasticOptions;
	client!: Client;

	constructor(options: ElasticOptions) {
		this.checkOptions(options);
		this.elasticOptions = options;
	}

	private checkOptions(options: ElasticOptions) {
		if (!options.node) throw new VariableNotSetException('Elastic uri');
	}

	createConnection() {
		const client = new Client(this.elasticOptions);
		this.client = client;
	}

	async insert(changeEvent: ChangeStreamInsertDocument) {
		// because ElasticSearch use _id in other place than document.
		delete changeEvent.fullDocument._id;
		return await Insert.handle(
			changeEvent.documentKey._id.toString(),
			changeEvent.fullDocument,
			changeEvent.ns.coll,
			this
		);
	}

	async update(changeEvent: ChangeStreamUpdateDocument, mongoDb: Db) {
		return await Update.handle(changeEvent.documentKey._id.toString(), changeEvent.ns.coll, mongoDb, this);
	}

	async delete(changeEvent: ChangeStreamDeleteDocument) {
		return await Delete.handle(changeEvent.documentKey._id.toString(), changeEvent.ns.coll, this);
	}

	async aggregate(
		changeEvent: ChangeStreamInsertDocument | ChangeStreamDeleteDocument | ChangeStreamUpdateDocument,
		mongoDb: Db,
		pipeline: Document[]
	) {
		return await Aggregate.handle(changeEvent.ns.coll, this, mongoDb, pipeline);
	}
}
