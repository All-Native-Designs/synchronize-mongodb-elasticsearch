export class CollectionNotFoundException extends Error {
	constructor(collectionName: string) {
		super();
		throw new Error(`Collection "${collectionName}" does not exist in database.`);
	}
}

export class VariableNotSetException extends Error {
	constructor(variableName: string) {
		super();
		throw new Error(`Variable "${variableName}" is required and is not set.`);
	}
}

export class CanNotCreateMongoClientException extends Error {
	constructor() {
		super();
		throw new Error(`Can not create MongoClient.`);
	}
}

export class CanNotCreateDocumentAtElasticSearchException extends Error {
	constructor() {
		super();
		throw new Error(`Can not create document at ElasticSearch.`);
	}
}

export class CanNotUpdateDocumentAtElasticSearchException extends Error {
	constructor() {
		super();
		throw new Error(`Can not update document at ElasticSearch.`);
	}
}

export class CanNotDeleteDocumentAtElasticSearchException extends Error {
	constructor() {
		super();
		throw new Error(`Can not delete document at ElasticSearch.`);
	}
}

export class CanNotGetDocumentFromMongoDBException extends Error {
	constructor() {
		super();
		throw new Error(`Can not get document from MongoDB.`);
	}
}
