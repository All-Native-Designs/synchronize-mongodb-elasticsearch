import { DeleteRequest, DeleteResponse } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamDeleteDocument } from 'mongodb';
import { ElasticClient } from '.';
import { ElasticQueryResult } from '../types/result.type';

export namespace Delete {
	export async function handle(
		changeEvent: ChangeStreamDeleteDocument,
		elasticClient: ElasticClient
	): Promise<ElasticQueryResult> {
		const params: DeleteRequest = {
			id: changeEvent.documentKey._id.toString(),
			index: changeEvent.ns.coll,
			refresh: 'wait_for',
		};
		const deletedDocument: DeleteResponse = await elasticClient.client.delete(params);
		if (deletedDocument.result === 'deleted') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}
}
