import { CreateRequest } from '@elastic/elasticsearch/lib/api/types';
import { Db, ObjectId } from 'mongodb';
import { CanNotDeleteDocumentAtElasticSearchException, CanNotGetDocumentFromMongoDBException } from '../errors';
import { ElasticQueryResult } from '../types/result.type';
import { Delete } from './delete';
import { ElasticClient } from './elastic-client';

export namespace Update {
	export async function handle(
		id: string,
		collection: string,
		mongoDb: Db,
		elasticClient: ElasticClient
	): Promise<ElasticQueryResult> {
		// instead of updating the document at ElasticSearch,
		// we delete the old document and insert the new one
		const getNewDocument = async () => await mongoDb.collection(collection).findOne({ _id: new ObjectId(id) });

		const deleteOldDocument = async () => await Delete.deleteExistence(id, collection, elasticClient);

		const [getNewResult, deleteOldResult] = await Promise.allSettled([getNewDocument(), deleteOldDocument()]);

		if (getNewResult.status === 'rejected') {
			throw new CanNotGetDocumentFromMongoDBException();
		} else if (!getNewResult.value) {
			throw new CanNotGetDocumentFromMongoDBException();
		}

		if (deleteOldResult.status === 'rejected') {
			throw new CanNotDeleteDocumentAtElasticSearchException();
		}

		// insert the new document into ElasticSearch
		const { _id, ...newDocument } = Object.assign({}, getNewResult.value);
		const createParams: CreateRequest = {
			id,
			index: collection,
			document: newDocument,
		};
		const createdDocument = await elasticClient.client.create(createParams);

		if (createdDocument.result === 'created') {
			return { ok: true };
		} else {
			return { ok: false };
		}
	}
}
