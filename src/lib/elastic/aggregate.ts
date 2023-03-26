import {
	ChangeStreamDeleteDocument,
	ChangeStreamInsertDocument,
	ChangeStreamUpdateDocument,
	Db,
	ObjectId,
} from 'mongodb';
import { ElasticClient } from './elastic-client';
import { CanNotCreateDocumentAtElasticSearchException, DoNotSupplyIdInDocumentException } from '../errors';
import { Document } from 'mongodb';
import { ElasticQueryResult } from '../types';
import { Insert } from './insert';

export namespace Aggregate {
	export async function handle(
		collection: string,
		elasticClient: ElasticClient,
		mongoDb: Db,
		pipeline: Document[]
	): Promise<ElasticQueryResult> {
		const cursor = mongoDb.collection(collection).aggregate(pipeline, {
			// @see: https://www.mongodb.com/docs/manual/reference/method/db.collection.aggregate/#specify-an-initial-batch-size
			cursor: { batchSize: 0 },
			// @see: https://www.mongodb.com/docs/manual/reference/method/db.collection.aggregate/#override-readconcern
			readConcern: { level: 'majority' },
			allowDiskUse: true,
		});

		// @see: https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/read-operations/cursor/#asynchronous-iteration
		for await (const doc of cursor) {
			const { _id, ...document } = doc;
			const result = await Insert.handle(_id, document, collection, elasticClient);
			if (!result.ok) throw new CanNotCreateDocumentAtElasticSearchException();
		}

		return { ok: true };
	}
}
