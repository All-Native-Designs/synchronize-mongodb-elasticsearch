import { Document } from 'mongodb';

export interface MongoDbOptions {
	uri: string;
	dbName: string;
	collections?: { name: string; pipeline?: Document[]; idInPipeline?: string }[];
}
