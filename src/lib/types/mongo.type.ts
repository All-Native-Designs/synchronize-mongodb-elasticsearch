import { Document } from 'mongodb';

export interface MongoDbOptions {
	uri: string;
	dbName: string;
	collections?: { name: string; pipeline?: Document[] }[];
	/**
	 * Is the size of the dataset that will be created from database for inserting into the ElasticSearch
	 */
	batchSize?: number;
}
