import { Stack, Construct } from '@aws-cdk/core';
import {
    AttributeType,
    BillingMode,
    StreamViewType,
    Table,
} from '@aws-cdk/aws-dynamodb';

export class AccountAutoCompleteTable extends Construct {
    public readonly table: Table;

    constructor(stack: Stack, id: string) {
        super(stack, id);

        this.table = new Table(this, 'table', {
            billingMode: BillingMode.PayPerRequest,
            streamSpecification: StreamViewType.NewImage,
            partitionKey: {
                name: 'accountId',
                type: AttributeType.String,
            },
            sortKey: {
                name: 'autoCompleteField',
                type: AttributeType.String,
            },
        });
    }
}
