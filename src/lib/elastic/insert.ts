import {
	BulkOperationType,
	BulkResponse,
	BulkResponseItem,
	CreateRequest,
	ErrorCause,
} from '@elastic/elasticsearch/lib/api/types';
import { Document } from 'mongodb';
import { ElasticQueryResult } from '../types/result.type';
import { Delete } from './delete';
import { ElasticClient } from './elastic-client';

export namespace Insert {
	export async function handle(
		id: string,
		document: Omit<Document, '_id'>,
		index: string,
		elasticClient: ElasticClient
	): Promise<ElasticQueryResult> {
		// check if document with the same _id exists in ElasticSearch
		await Delete.deleteExistence(id, index, elasticClient);

		const params: CreateRequest = {
			id,
			index,
			document,
		};

		const result = await elasticClient.client.create(params);
		if (result.result === 'created') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}

	export async function bulk(documents: Document[], collName: string, elasticClient: ElasticClient) {
		// create index
		await elasticClient.client.indices.create({ index: collName }, { ignore: [400] });

		// bulk insert
		const operations = documents.flatMap(({ _id, ...document }) => [
			{ index: { _index: collName, _id: _id.toString() } },
			document,
		]);
		const bulkResponse: BulkResponse = await elasticClient.client.bulk({ refresh: true, operations });

		if (bulkResponse.errors) {
			const erroredDocuments: {
				status: number;
				error: ErrorCause;
				operation: Document;
				document: Document;
			}[] = [];
			// The items array has the same order of the dataset we just indexed.
			bulkResponse.items.forEach((action: Partial<Record<BulkOperationType, BulkResponseItem>>, i) => {
				const operation = Object.keys(action)[0] as BulkOperationType;
				const actionOperation = action[operation];
				// The presence of the `error` key indicates that the operation
				// that we did for the document has failed.
				if (actionOperation && actionOperation.error) {
					erroredDocuments.push({
						// If the status is 429 it means that you can retry the document,
						// otherwise it's very likely a mapping error, and you should
						// fix the document before to try it again.
						status: actionOperation.status,
						error: actionOperation.error,
						operation: operations[i * 2],
						document: operations[i * 2 + 1],
					});
				}
			});
			console.log({ erroredDocuments });
		}
	}
}
