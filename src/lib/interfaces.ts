export interface MongoOptions {
	uri: string;
	dbName: string;
	collections?: string[];
}

export interface ElasticOptions {
	uri: string;
}
