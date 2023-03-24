import { Client } from '@elastic/elasticsearch';
import { VariableNotSetException } from './errors';
import { ElasticOptions } from './interfaces';

export class ElasticClient {
	private elasticOptions: ElasticOptions;
	client!: Client;

	constructor(options: ElasticOptions) {
		this.checkOptions(options);

		this.elasticOptions = options;
	}

	private checkOptions(options: ElasticOptions) {
		if (options.uri.length === 0) throw new VariableNotSetException('Elastic uri');
	}

	createConnection() {
		const client = new Client({
			cloud: { id: '<cloud-id>' },
			auth: { apiKey: 'base64EncodedKey' },
		});
		this.client = client;
	}
}
