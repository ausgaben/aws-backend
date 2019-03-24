import { Stack, Construct } from '@aws-cdk/cdk';
import {
    AttributeType,
    BillingMode,
    StreamViewType,
    Table,
    ProjectionType,
} from '@aws-cdk/aws-dynamodb';

export class AccountUsersTable extends Construct {
    public readonly table: Table;

    constructor(stack: Stack, id: string) {
        super(stack, id);

        this.table = new Table(this, 'table', {
            billingMode: BillingMode.PayPerRequest,
            streamSpecification: StreamViewType.NewImage,
            partitionKey: {
                name: 'aggregateId',
                type: AttributeType.String,
            },
        });

        this.table.addGlobalSecondaryIndex({
            indexName: 'userIdIndex',
            projectionType: ProjectionType.Include,
            partitionKey: {
                name: 'userId',
                type: AttributeType.String,
            },
            nonKeyAttributes: ['accountId'],
        });

        this.table.addGlobalSecondaryIndex({
            indexName: 'accountIdIndex',
            projectionType: ProjectionType.KeysOnly,
            partitionKey: {
                name: 'accountId',
                type: AttributeType.String,
            },
        });
    }
}
