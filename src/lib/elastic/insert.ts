import { CreateRequest } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamInsertDocument, Document } from 'mongodb';
import { ElasticQueryResult } from '../types/result.type';
import { Delete } from './delete';
import { ElasticClient } from './elastic-client';

export namespace Insert {
	export async function handle(
		id: string,
		document: Omit<Document, '_id'>,
		collection: string,
		elasticClient: ElasticClient
	): Promise<ElasticQueryResult> {
		// check if document with the same _id exists in ElasticSearch
		await Delete.deleteExistence(id, collection, elasticClient);

		const params: CreateRequest = {
			id,
			index: collection,
			document,
		};

		const result = await elasticClient.client.create(params);
		if (result.result === 'created') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}
}
