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

export class ApiFeature extends Construct {
    public readonly api: CfnGraphQLApi;

    constructor(
        stack: Stack,
        id: string,
        lambdas: {
            createAccountMutation: Code;
        },
        baseLayer: ILayerVersion,
        aggregateEventsTable: AggregateEventsTable,
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

        const createAccountMutation = new Function(
            this,
            'createAccountMutation',
            {
                code: lambdas.createAccountMutation,
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
                    new PolicyStatement(PolicyStatementEffect.Allow)
                        .addResource(aggregateEventsTable.table.tableArn)
                        .addAction('dynamodb:PutItem'),
                ],
                environment: {
                    AGGREGATE_EVENTS_TABLE:
                        aggregateEventsTable.table.tableName,
                },
                layers: [baseLayer],
            },
        );

        new LogGroup(this, 'createAccountMutationLogGroup', {
            retainLogGroup: false,
            logGroupName: `/aws/lambda/${createAccountMutation.functionName}`,
            retentionDays: 7,
        });

        new GQLLambdaResolver(
            this,
            this.api,
            'createAccount',
            'Mutation',
            createAccountMutation,
        );
    }
}
