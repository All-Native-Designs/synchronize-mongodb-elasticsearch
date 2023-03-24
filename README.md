# synchronize-mongodb-elasticsearch

This package is for watching MongoDB change events and synchronize changes with ElasticSearch.

## Example

Add the following script to your main file or where you want to start synchronizing MongoDB with ElasticSearch.

```javascript
const mongoOptions: MongoOptions = {
	uri: 'db-uri,
	dbName: 'db-name,
	collections: ['collection-1'],
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
const syncDbWithElasticsearch = new SyncMongoDbWithElasticSearch(mongoOptions, elasticOptions);
syncDbWithElasticsearch.start();
```
