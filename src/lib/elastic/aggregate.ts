import { Db, Document } from 'mongodb';
import { ElasticQueryResult } from '../types';
import { ElasticClient } from './elastic-client';

export namespace Aggregate {
	export async function handle(
		collName: string,
		pipeline: Document[],
		elasticClient: ElasticClient,
		mongoDb: Db,
		batchSize = 100
	): Promise<ElasticQueryResult> {
		const allDocumentsCursor = mongoDb.collection(collName).aggregate(pipeline, {
			// @see: https://www.mongodb.com/docs/manual/reference/method/db.collection.aggregate/#specify-an-initial-batch-size
			cursor: { batchSize: 0 },
			// @see: https://www.mongodb.com/docs/manual/reference/method/db.collection.aggregate/#override-readconcern
			readConcern: { level: 'majority' },
			allowDiskUse: true,
		});
		await elasticClient.handleBulkCursor(allDocumentsCursor, batchSize, collName);
		return { ok: true };
	}
}
