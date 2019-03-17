import { Stack, Construct } from '@aws-cdk/cdk';
import {
    AttributeType,
    BillingMode,
    StreamViewType,
    Table,
} from '@aws-cdk/aws-dynamodb';

export class AccountsTable extends Construct {
    public readonly table: Table;

    constructor(stack: Stack, id: string) {
        super(stack, id);

        this.table = new Table(this, 'table', {
            billingMode: BillingMode.PayPerRequest,
            streamSpecification: StreamViewType.NewImage,
            partitionKey: {
                name: 'aggregateUUID',
                type: AttributeType.String,
            },
        });
    }
}
