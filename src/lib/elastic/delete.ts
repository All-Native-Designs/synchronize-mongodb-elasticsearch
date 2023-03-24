import { ChangeStreamDeleteDocument } from 'mongodb';
import { ElasticClient } from '.';
import { ElasticQueryResult } from '../types/result.type';
import { DeleteRequest, DeleteResponse } from '@elastic/elasticsearch/lib/api/types';

export class DeleteElastic {
	private elasticClient: ElasticClient;

	constructor(elasticClient: ElasticClient) {
		this.elasticClient = elasticClient;
	}

	async handle(changeEvent: ChangeStreamDeleteDocument): Promise<ElasticQueryResult> {
		const params: DeleteRequest = {
			id: changeEvent.documentKey._id.toString(),
			index: changeEvent.ns.coll,
			refresh: 'wait_for',
		};
		const deletedDocument: DeleteResponse = await this.elasticClient.client.delete(params);
		if (deletedDocument.result === 'deleted') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}
}
