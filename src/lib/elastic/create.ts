import { CreateRequest, CreateResponse } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamInsertDocument } from 'mongodb';
import { ElasticQueryResult } from '../types/result.type';
import { ElasticClient } from './elastic-client';

export namespace Insert {
	export async function handle(
		changeEvent: ChangeStreamInsertDocument,
		elasticClient: ElasticClient
	): Promise<ElasticQueryResult> {
		console.log({ changeEvent });
		const { _id, ...newDocument } = Object.assign({}, changeEvent.fullDocument);
		const params: CreateRequest = {
			id: changeEvent.fullDocument._id,
			index: changeEvent.ns.coll,
			document: newDocument,
		};
		const createdDocument: CreateResponse = await elasticClient.client.create(params);
		if (createdDocument.result === 'created') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}
}
