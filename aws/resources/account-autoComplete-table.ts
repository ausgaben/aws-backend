import { Stack, Construct } from '@aws-cdk/core'
import {
	AttributeType,
	BillingMode,
	StreamViewType,
	Table,
} from '@aws-cdk/aws-dynamodb'

export class AccountAutoCompleteTable extends Construct {
	public readonly table: Table

	constructor(stack: Stack, id: string) {
		super(stack, id)

		this.table = new Table(this, 'table', {
			billingMode: BillingMode.PAY_PER_REQUEST,
			stream: StreamViewType.NEW_IMAGE,
			partitionKey: {
				name: 'accountId',
				type: AttributeType.STRING,
			},
			sortKey: {
				name: 'autoCompleteField',
				type: AttributeType.STRING,
			},
		})
	}
}
