import { CreateRequest, DeleteRequest } from '@elastic/elasticsearch/lib/api/types';
import { ChangeStreamUpdateDocument } from 'mongodb';
import { CanNotDeleteDocumentAtElasticSearchException, CanNotGetDocumentFromMongoDBException } from '../errors';
import { MongoDbClient } from '../mongodb/mongodb-client';
import { ElasticQueryResult } from '../types/result.type';
import { ElasticClient } from './elastic-client';

export namespace Update {
	export async function handle(
		changeEvent: ChangeStreamUpdateDocument,
		mongoDbClient: MongoDbClient,
		elasticClient: ElasticClient
	): Promise<ElasticQueryResult> {
		// instead of updating the document at ElasticSearch,
		// we delete the old document and insert the new one
		const getNewDocument = async () =>
			await mongoDbClient.getDb().collection(changeEvent.ns.coll).findOne({ _id: changeEvent.documentKey._id });
		const deleteParams: DeleteRequest = { id: changeEvent.documentKey._id.toString(), index: changeEvent.ns.coll };
		const deleteOldDocument = async () => await elasticClient.client.delete(deleteParams);
		const [getResult, deleteResult] = await Promise.allSettled([getNewDocument(), deleteOldDocument()]);

		if (getResult.status === 'rejected') {
			throw new CanNotGetDocumentFromMongoDBException();
		} else if (!getResult.value) {
			throw new CanNotGetDocumentFromMongoDBException();
		}

		if (deleteResult.status === 'rejected') {
			if (deleteResult.reason?.meta?.body?.result !== 'not_found') {
				throw new CanNotDeleteDocumentAtElasticSearchException();
			}
		}

		// insert the new document into ElasticSearch
		const { _id, ...newDocument } = Object.assign({}, getResult.value);
		const createParams: CreateRequest = {
			id: changeEvent.documentKey._id.toString(),
			index: changeEvent.ns.coll,
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
