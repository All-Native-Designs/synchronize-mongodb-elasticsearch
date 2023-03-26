import { DeleteRequest, DeleteResponse } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamDeleteDocument } from 'mongodb';
import { ElasticClient } from '.';
import { ElasticQueryResult } from '../types/result.type';
import { CanNotDeleteDocumentAtElasticSearchException } from '../errors';
import { ResponseError } from '@elastic/transport/lib/errors';

export namespace Delete {
	export async function handle(id: string, index: string, elasticClient: ElasticClient): Promise<ElasticQueryResult> {
		const params: DeleteRequest = {
			id,
			index,
			refresh: 'wait_for',
		};
		const deletedDocument: DeleteResponse = await elasticClient.client.delete(params);
		if (deletedDocument.result === 'deleted') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}

	/**
	 * If we want to insert document with the same _id into ElasticSearch,
	 * we should first delete the old document.
	 * @param id
	 * @param index
	 * @param elasticClient
	 */
	export async function deleteExistence(id: string, index: string, elasticClient: ElasticClient) {
		try {
			const oldDocument = await elasticClient.client.get({ id: id, index });
			if (oldDocument._id === id) {
				const deleteParams: DeleteRequest = {
					id,
					index,
				};
				await elasticClient.client.delete(deleteParams);
			}
		} catch (error: any) {
			if (error instanceof ResponseError && error.statusCode === 404) {
				return;
			} else {
				throw new CanNotDeleteDocumentAtElasticSearchException();
			}
		}
	}
}
