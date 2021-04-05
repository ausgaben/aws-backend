import { Stack, Construct } from '@aws-cdk/core'
import {
	AttributeType,
	BillingMode,
	StreamViewType,
	Table,
	ProjectionType,
} from '@aws-cdk/aws-dynamodb'

export class SpendingsTable extends Construct {
	public readonly table: Table

	constructor(stack: Stack, id: string) {
		super(stack, id)

		this.table = new Table(this, 'table', {
			billingMode: BillingMode.PAY_PER_REQUEST,
			stream: StreamViewType.NEW_IMAGE,
			partitionKey: {
				name: 'aggregateId',
				type: AttributeType.STRING,
			},
		})

		this.table.addGlobalSecondaryIndex({
			indexName: 'accountIdIndex',
			projectionType: ProjectionType.KEYS_ONLY,
			partitionKey: {
				name: 'accountId',
				type: AttributeType.STRING,
			},
			sortKey: {
				name: 'bookedAt',
				type: AttributeType.STRING,
			},
		})

		this.table.addGlobalSecondaryIndex({
			indexName: 'transferToAccountIdIndex',
			projectionType: ProjectionType.KEYS_ONLY,
			partitionKey: {
				name: 'transferToAccountId',
				type: AttributeType.STRING,
			},
			sortKey: {
				name: 'bookedAt',
				type: AttributeType.STRING,
			},
		})
	}
}
