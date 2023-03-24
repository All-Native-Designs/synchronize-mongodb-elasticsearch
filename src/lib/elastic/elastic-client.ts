import { Client } from '@elastic/elasticsearch';
import { VariableNotSetException } from '../errors/errors';
import { ElasticOptions } from '../types';

export class ElasticClient {
	private elasticOptions: ElasticOptions;
	client!: Client;

	constructor(options: ElasticOptions) {
		this.checkOptions(options);
		this.elasticOptions = options;
	}

	private checkOptions(options: ElasticOptions) {
		if (!options.node) throw new VariableNotSetException('Elastic uri');
	}

	createConnection() {
		const client = new Client(this.elasticOptions);
		this.client = client;
	}
}
