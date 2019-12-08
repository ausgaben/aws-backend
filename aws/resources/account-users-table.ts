import { Stack, Construct } from '@aws-cdk/core'
import {
	AttributeType,
	BillingMode,
	StreamViewType,
	Table,
	ProjectionType,
} from '@aws-cdk/aws-dynamodb'

export class AccountUsersTable extends Construct {
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
			indexName: 'userIdIndex',
			projectionType: ProjectionType.KEYS_ONLY,
			partitionKey: {
				name: 'userId',
				type: AttributeType.STRING,
			},
			sortKey: {
				name: 'accountId',
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
				name: 'userId',
				type: AttributeType.STRING,
			},
		})
	}
}
