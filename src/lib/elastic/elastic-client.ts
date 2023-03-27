import { Client } from '@elastic/elasticsearch';
import {
	AggregationCursor,
	ChangeStreamDeleteDocument,
	ChangeStreamInsertDocument,
	ChangeStreamUpdateDocument,
	Db,
	Document,
	FindCursor,
} from 'mongodb';
import { VariableNotSetException } from '../errors/errors';
import { ElasticOptions } from '../types';
import { Aggregate } from './aggregate';
import { Delete } from './delete';
import { Insert } from './insert';
import { Update } from './update';

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

	async aggregate(collection: string, mongoDb: Db, pipeline: Document[]) {
		return await Aggregate.handle(collection, pipeline, this, mongoDb);
	}

	async fillWithMongoDbData(collName: string, mongoDb: Db, batchSize = 100) {
		// @see: https://www.mongodb.com/community/forums/t/mis-understanding-batchsize/169713/2
		// batchSize is only for server that how it makes the response
		const allDocumentsCursor = mongoDb.collection(collName).find();
		await this.handleBulkCursor(allDocumentsCursor, batchSize, collName);
	}

	async handleBulkCursor(allDocumentsCursor: FindCursor | AggregationCursor, batchSize: number, collName: string) {
		let documents: Document[] = [];
		for await (const doc of allDocumentsCursor) {
			// const { _id, ...document } = doc;
			documents.push(doc);
			const hasNext = await allDocumentsCursor.hasNext();
			if ((!hasNext && documents.length > 0) || batchSize === documents.length) {
				await Insert.bulk(documents, collName, this);
				documents = [];
			}
		}
	}
}
