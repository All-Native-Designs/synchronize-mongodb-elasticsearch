# synchronize-mongodb-elasticsearch

This package is for watching MongoDB change events and synchronize changes with ElasticSearch.

When using this package, please pay attention to the following notes:

-   For each collection, user can determine a pipeline so that specific data being created from MongoDB and kept in ElasticSearch server. Adding a pipeline for each collection is optional.

-   If the user want to insert a document with an "\_id" that already exists in ElasticSearch server,
    we first delete the old document from ElasticSearch, then insert the new one,
    hence the old document is replaced with the new one.

-   The same "\_id" (from MongoDB) has been used as the id of the documents in ElasticSearch server.

## Example

Add the following script to your main file or where you want to start synchronizing MongoDB with ElasticSearch.

```javascript
const mongoDbOptions: MongoDbOptions = {
	uri: config.mongodbURI,
	dbName: config.dbName,
	collections: [
		{
			name: 'collection-name',
			pipeline: [{ $match: { name: { $regex: 'jan' } } }, { $group: { _id: '$name', totalDocs: { $sum: 1 } } }],
		},
	],
};
const elasticOptions: ElasticOptions = {
	node: 'http://localhost:9200',
	auth: {
		username: 'elastic',
		password: 'elastic-user-password',
	},
	// tls: {
	// 	ca: fs.readFileSync('./http_ca.crt'),
	// 	rejectUnauthorized: false,
	// },
};
const syncDbWithElasticsearch = new SyncMongoDbWithElasticSearch(mongoDbOptions, elasticOptions);
syncDbWithElasticsearch.start();
```
