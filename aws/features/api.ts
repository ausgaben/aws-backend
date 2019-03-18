import { Construct, Stack } from '@aws-cdk/cdk';
import {
    IRole,
    PolicyStatement,
    PolicyStatementEffect,
    Role,
    ServicePrincipal,
} from '@aws-cdk/aws-iam';
import { Code, Function, ILayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import { LogGroup } from '@aws-cdk/aws-logs';
import { AggregateEventsTable } from '../resources/aggregate-events-table';
import { CfnGraphQLApi, CfnGraphQLSchema } from '@aws-cdk/aws-appsync';
import { readFileSync } from 'fs';
import * as path from 'path';
import { GQLLambdaResolver } from '../resources/GQLLambdaResolver';
import { AccountsTable } from '../resources/accounts-table';

export class ApiFeature extends Construct {
    public readonly api: CfnGraphQLApi;

    constructor(
        stack: Stack,
        id: string,
        lambdas: {
            createAccountMutation: Code;
            accountsQuery: Code;
        },
        baseLayer: ILayerVersion,
        aggregateEventsTable: AggregateEventsTable,
        accountsTable: AccountsTable,
        userRole: IRole,
    ) {
        super(stack, id);

        const apiRole = new Role(this, 'Role', {
            assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        });
        apiRole.addToPolicy(
            new PolicyStatement(PolicyStatementEffect.Allow)
                .addResource(
                    `arn:aws:logs:${stack.region}:${
                        stack.accountId
                    }:/aws/lambda/*`,
                )
                .addAction('logs:CreateLogGroup')
                .addAction('logs:CreateLogStream')
                .addAction('logs:PutLogEvents'),
        );

        this.api = new CfnGraphQLApi(this, 'Api', {
            name: 'Ausgaben',
            authenticationType: 'AWS_IAM',
            logConfig: {
                fieldLogLevel: 'ALL',
                cloudWatchLogsRoleArn: apiRole.roleArn,
            },
        });

        userRole.addToPolicy(
            new PolicyStatement(PolicyStatementEffect.Allow)
                .addAction('appsync:GraphQL')
                .addResource(`${this.api.getAtt('Arn')}/*`),
        );

        new LogGroup(this, 'LogGroup', {
            retainLogGroup: false,
            logGroupName: `/aws/appsync/apis/${this.api.graphQlApiApiId}`,
            retentionDays: 7,
        });

        new CfnGraphQLSchema(this, 'Schema', {
            apiId: this.api.graphQlApiApiId,
            definition: readFileSync(
                path.resolve(
                    __dirname,
                    '..',
                    '..',
                    '..',
                    'appsync',
                    'schema.graphql',
                ),
                'utf-8',
            ),
        });

        gqlLambda(
            this,
            stack,
            baseLayer,
            this.api,
            'createAccount',
            'Mutation',
            lambdas.createAccountMutation,
            [
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(aggregateEventsTable.table.tableArn)
                    .addAction('dynamodb:PutItem'),
            ],
            {
                AGGREGATE_EVENTS_TABLE: aggregateEventsTable.table.tableName,
            },
        );

        gqlLambda(
            this,
            stack,
            baseLayer,
            this.api,
            'accounts',
            'Query',
            lambdas.accountsQuery,
            [
                new PolicyStatement(PolicyStatementEffect.Allow)
                    .addResource(accountsTable.table.tableArn)
                    .addAction('dynamodb:Query'),
            ],
            {
                ACCOUNTS_TABLE: accountsTable.table.tableName,
            },
        );
    }
}

const gqlLambda = (
    parent: Construct,
    stack: Stack,
    baseLayer: ILayerVersion,
    api: CfnGraphQLApi,
    field: string,
    type: 'Query' | 'Mutation',
    lambda: Code,
    policies: PolicyStatement[],
    environment: {
        [key: string]: any;
    },
) => {
    const f = new Function(parent, `${field}${type}`, {
        handler: 'index.handler',
        runtime: Runtime.NodeJS810,
        timeout: 30,
        memorySize: 1792,
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
            ...policies,
        ],
        environment,
        layers: [baseLayer],
        code: lambda,
    });

    new LogGroup(parent, `${field}${type}LogGroup`, {
        retainLogGroup: false,
        logGroupName: `/aws/lambda/${f.functionName}`,
        retentionDays: 7,
    });

    new GQLLambdaResolver(parent, api, field, type, f);
};
