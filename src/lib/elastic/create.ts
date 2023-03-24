import { CreateRequest, CreateResponse, UpdateRequest, UpdateResponse } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamInsertDocument, UpdateDescription } from 'mongodb';
import {
	CanNotCreateDocumentAtElasticSearchException,
	CanNotUpdateDocumentAtElasticSearchException,
} from '../errors/errors';
import { ElasticClient } from './elastic-client';
import { ElasticQueryResult } from '../types/result.type';

export class CreateElastic {
	private elasticClient: ElasticClient;

	constructor(elasticClient: ElasticClient) {
		this.elasticClient = elasticClient;
	}

	async handle(changeEvent: ChangeStreamInsertDocument): Promise<ElasticQueryResult> {
		console.log({ changeEvent });
		const { _id, ...newDocument } = Object.assign({}, changeEvent.fullDocument);
		const params: CreateRequest = {
			id: changeEvent.fullDocument._id,
			index: changeEvent.ns.coll,
			document: newDocument,
		};
		const createdDocument: CreateResponse = await this.elasticClient.client.create(params);
		if (createdDocument.result === 'created') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}
}
