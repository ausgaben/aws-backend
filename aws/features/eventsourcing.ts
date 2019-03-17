import { Construct, Stack } from '@aws-cdk/cdk';
import { PolicyStatement, PolicyStatementEffect } from '@aws-cdk/aws-iam';
import {
    Code,
    EventSourceMapping,
    Function,
    ILayerVersion,
    Runtime,
    StartingPosition,
} from '@aws-cdk/aws-lambda';
import { LogGroup } from '@aws-cdk/aws-logs';
import { AccountsTable } from '../resources/accounts-table';
import { AggregateEventsTable } from '../resources/aggregate-events-table';

export class EventSourcingFeature extends Construct {
    constructor(
        stack: Stack,
        id: string,
        eventReducerLambda: Code,
        baseLayer: ILayerVersion,
        aggregateEventsTable: AggregateEventsTable,
        accountsTable: AccountsTable,
    ) {
        super(stack, id);

        const l = new Function(this, 'eventReducer', {
            code: eventReducerLambda,

            handler: 'index.handler',
            runtime: Runtime.NodeJS810,
            timeout: 300,
            memorySize: 1792,
            description:
                'Listens to a DynamoDB stream from the events table, reduces them and stores / updates the aggregates in the respective collection.',
            reservedConcurrentExecutions: 1,
            initialPolicy: [
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(
                        `arn:aws:logs:${stack.region}:${
                            stack.accountId
                        }:/aws/lambda/*`,
                    )
                    .addAction('logs:CreateLogGroup')
                    .addAction('logs:CreateLogStream')
                    .addAction('logs:PutLogEvents'),
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(accountsTable.table.tableArn)
                    .addActions('dynamodb:PutItem')
                    .addAction('dynamodb:GetItem')
                    .addAction('dynamodb:DeleteItem')
                    .addAction('dynamodb:UpdateItem'),
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(aggregateEventsTable.table.tableStreamArn)
                    .addResource(
                        `${aggregateEventsTable.table.tableStreamArn}/*`,
                    )
                    .addAction('dynamodb:GetRecords')
                    .addAction('dynamodb:GetShardIterator')
                    .addAction('dynamodb:DescribeStream')
                    .addAction('dynamodb:ListStreams'),
            ],
            environment: {
                ACCOUNTS_TABLE: accountsTable.table.tableName,
            },
            layers: [baseLayer],
        });

        new EventSourceMapping(this, 'EventSourceMapping', {
            eventSourceArn: aggregateEventsTable.table.tableStreamArn,
            target: l,
            startingPosition: StartingPosition.Latest,
        });

        new LogGroup(this, 'LogGroup', {
            retainLogGroup: false,
            logGroupName: `/aws/lambda/${l.functionName}`,
            retentionDays: 7,
        });
    }
}
