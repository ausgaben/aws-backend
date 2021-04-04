import { Construct, RemovalPolicy, Stack, Duration } from '@aws-cdk/core'
import {
	IRole,
	PolicyStatement,
	Role,
	ServicePrincipal,
} from '@aws-cdk/aws-iam'
import { Code, Function, ILayerVersion, Runtime } from '@aws-cdk/aws-lambda'
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs'
import { AggregateEventsTable } from '../resources/aggregate-events-table'
import { CfnGraphQLApi, CfnGraphQLSchema } from '@aws-cdk/aws-appsync'
import { readFileSync } from 'fs'
import * as path from 'path'
import { GQLLambdaResolver } from '../resources/GQLLambdaResolver'
import { AccountsTable } from '../resources/accounts-table'
import { AccountUsersTable } from '../resources/account-users-table'
import { SpendingsTable } from '../resources/spendings-table'
import { AccountAutoCompleteTable } from '../resources/account-autoComplete-table'
import { ExchangeRatesTable } from '../resources/exchange-rates-table'
import { Table } from '@aws-cdk/aws-dynamodb'

const gqlLambda = (
	parent: Construct,
	stack: Stack,
	baseLayer: ILayerVersion,
	api: CfnGraphQLApi,
	field: string,
	type: 'Query' | 'Mutation',
	lambda: Code,
	dynamodb: {
		read?: Record<string, { table: Table }>
		write?: Record<string, { table: Table }>
	},
) => {
	const f = new Function(parent, `${field}${type}`, {
		handler: 'index.handler',
		runtime: Runtime.NODEJS_14_X,
		timeout: Duration.seconds(30),
		memorySize: 1792,
		initialPolicy: [
			new PolicyStatement({
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents',
				],
				resources: [
					`arn:aws:logs:${stack.region}:${stack.account}:/aws/lambda/*`,
				],
			}),
			...Object.values(dynamodb.read ?? {}).map(
				({ table }) =>
					new PolicyStatement({
						actions: [
							'dynamodb:Query',
							'dynamodb:GetItem',
							'dynamodb:BatchGetItem',
						],
						resources: [table.tableArn, `${table.tableArn}/*`],
					}),
			),
			...Object.values(dynamodb.write ?? {}).map(
				({ table }) =>
					new PolicyStatement({
						actions: ['dynamodb:PutItem'],
						resources: [table.tableArn],
					}),
			),
		],
		environment: [
			...Object.entries(dynamodb?.read ?? {}),
			...Object.entries(dynamodb?.write ?? {}),
		].reduce(
			(env, [k, { table }]) => ({ ...env, [k]: table.tableName }),
			{},
		),
		layers: [baseLayer],
		code: lambda,
	})

	f.node.addDependency(api)

	new LogGroup(parent, `${field}${type}LogGroup`, {
		removalPolicy: RemovalPolicy.DESTROY,
		logGroupName: `/aws/lambda/${f.functionName}`,
		retention: RetentionDays.ONE_WEEK,
	})

	new GQLLambdaResolver(parent, api, field, type, f)
}

export class ApiFeature extends Construct {
	public readonly api: CfnGraphQLApi

	constructor(
		stack: Stack,
		id: string,
		lambdas: {
			createAccountMutation: Code
			deleteAccountMutation: Code
			accountsQuery: Code
			createSpendingMutation: Code
			updateSpendingMutation: Code
			updateAccountMutation: Code
			deleteSpendingMutation: Code
			spendingsQuery: Code
			inviteUserMutation: Code
			autoCompleteStringsQuery: Code
			exchangeRateQuery: Code
		},
		baseLayer: ILayerVersion,
		aggregateEventsTable: AggregateEventsTable,
		accountsTable: AccountsTable,
		accountUsersTable: AccountUsersTable,
		spendingsTable: SpendingsTable,
		accountAutoCompleteTable: AccountAutoCompleteTable,
		exchangeRatesTable: ExchangeRatesTable,
		userRole: IRole,
	) {
		super(stack, id)

		const apiRole = new Role(this, 'Role', {
			assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
		})
		apiRole.addToPolicy(
			new PolicyStatement({
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents',
				],
				resources: [
					`arn:aws:logs:${stack.region}:${stack.account}:/aws/lambda/*`,
				],
			}),
		)

		this.api = new CfnGraphQLApi(this, 'Api', {
			name: 'Ausgaben',
			authenticationType: 'AWS_IAM',
			logConfig: {
				fieldLogLevel: 'ALL',
				cloudWatchLogsRoleArn: apiRole.roleArn,
			},
		})

		userRole.addToPolicy(
			new PolicyStatement({
				actions: ['appsync:GraphQL'],
				resources: [`${this.api.attrArn}/*`],
			}),
		)

		new LogGroup(this, 'LogGroup', {
			removalPolicy: RemovalPolicy.DESTROY,
			logGroupName: `/aws/appsync/apis/${this.api.attrApiId}`,
			retention: RetentionDays.ONE_WEEK,
		})

		new CfnGraphQLSchema(this, 'Schema', {
			apiId: this.api.attrApiId,
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
		})

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'createAccount',
			'Mutation',
			lambdas.createAccountMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'deleteAccount',
			'Mutation',
			lambdas.deleteAccountMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
				read: {
					ACCOUNTS_TABLE: accountsTable,
					ACCOUNT_USERS_TABLE: accountUsersTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'accounts',
			'Query',
			lambdas.accountsQuery,
			{
				read: {
					ACCOUNTS_TABLE: accountsTable,
					ACCOUNT_USERS_TABLE: accountUsersTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'createSpending',
			'Mutation',
			lambdas.createSpendingMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
				read: { ACCOUNT_USERS_TABLE: accountUsersTable },
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'updateSpending',
			'Mutation',
			lambdas.updateSpendingMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
				read: {
					SPENDINGS_TABLE: spendingsTable,
					ACCOUNT_USERS_TABLE: accountUsersTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'updateAccount',
			'Mutation',
			lambdas.updateAccountMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
				read: {
					ACCOUNT_USERS_TABLE: accountUsersTable,
					ACCOUNTS_TABLE: accountsTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'deleteSpending',
			'Mutation',
			lambdas.deleteSpendingMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
				read: {
					SPENDINGS_TABLE: spendingsTable,
					ACCOUNT_USERS_TABLE: accountUsersTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'spendings',
			'Query',
			lambdas.spendingsQuery,
			{
				read: {
					SPENDINGS_TABLE: spendingsTable,
					ACCOUNT_USERS_TABLE: accountUsersTable,
					ACCOUNTS_TABLE: accountsTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'inviteUser',
			'Mutation',
			lambdas.inviteUserMutation,
			{
				write: { AGGREGATE_EVENTS_TABLE: aggregateEventsTable },
				read: { ACCOUNT_USERS_TABLE: accountUsersTable },
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'autoCompleteStrings',
			'Query',
			lambdas.autoCompleteStringsQuery,
			{
				read: {
					ACCOUNT_AUTOCOMPLETE_TABLE: accountAutoCompleteTable,
					ACCOUNT_USERS_TABLE: accountUsersTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			this.api,
			'exchangeRate',
			'Query',
			lambdas.exchangeRateQuery,
			{
				read: {
					EXCHANGE_RATES_TABLE: exchangeRatesTable,
				},
			},
		)
	}
}
