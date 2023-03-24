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
