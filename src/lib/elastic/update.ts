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

		const getOldDocument = async () =>
			await elasticClient.client.get({ id: changeEvent.documentKey._id.toString(), index: changeEvent.ns.coll });

		const [getNewResult, getOldResult] = await Promise.allSettled([getNewDocument(), getOldDocument()]);

		if (getNewResult.status === 'rejected') {
			throw new CanNotGetDocumentFromMongoDBException();
		} else if (!getNewResult.value) {
			throw new CanNotGetDocumentFromMongoDBException();
		}

		if (getOldResult.status === 'fulfilled') {
			const deleteParams: DeleteRequest = {
				id: changeEvent.documentKey._id.toString(),
				index: changeEvent.ns.coll,
			};
			try {
				await elasticClient.client.delete(deleteParams);
			} catch (error) {
				throw new CanNotDeleteDocumentAtElasticSearchException();
			}
		}

		// insert the new document into ElasticSearch
		const { _id, ...newDocument } = Object.assign({}, getNewResult.value);
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
