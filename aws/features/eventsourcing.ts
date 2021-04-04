import { Construct, Duration, RemovalPolicy, Stack } from '@aws-cdk/core'
import { PolicyStatement } from '@aws-cdk/aws-iam'
import {
	Code,
	EventSourceMapping,
	Function,
	ILayerVersion,
	Runtime,
	StartingPosition,
} from '@aws-cdk/aws-lambda'
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs'
import { AccountsTable } from '../resources/accounts-table'
import { AccountUsersTable } from '../resources/account-users-table'
import { AggregateEventsTable } from '../resources/aggregate-events-table'
import { SpendingsTable } from '../resources/spendings-table'
import { AccountAutoCompleteTable } from '../resources/account-autoComplete-table'

export class EventSourcingFeature extends Construct {
	constructor(
		stack: Stack,
		id: string,
		eventReducerLambda: Code,
		baseLayer: ILayerVersion,
		aggregateEventsTable: AggregateEventsTable,
		accountsTable: AccountsTable,
		accountUsersTable: AccountUsersTable,
		spendingsTable: SpendingsTable,
		accountAutoCompleteTable: AccountAutoCompleteTable,
	) {
		super(stack, id)

		const l = new Function(this, 'eventReducer', {
			code: eventReducerLambda,
			handler: 'index.handler',
			runtime: Runtime.NODEJS_14_X,
			timeout: Duration.seconds(300),
			memorySize: 1792,
			description:
				'Listens to a DynamoDB stream from the events table, reduces them and stores / updates the aggregates in the respective collection.',
			reservedConcurrentExecutions: 1,
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
				new PolicyStatement({
					actions: [
						'dynamodb:PutItem',
						'dynamodb:GetItem',
						'dynamodb:DeleteItem',
						'dynamodb:Query',
						'dynamodb:UpdateItem',
					],
					resources: [
						accountsTable.table.tableArn,
						accountUsersTable.table.tableArn,
						spendingsTable.table.tableArn,
						accountAutoCompleteTable.table.tableArn,
					],
				}),
				new PolicyStatement({
					actions: [
						'dynamodb:GetRecords',
						'dynamodb:GetShardIterator',
						'dynamodb:DescribeStream',
						'dynamodb:ListStreams',
					],
					resources: [
						aggregateEventsTable.table.tableStreamArn as string,
						`${aggregateEventsTable.table.tableStreamArn}/*`,
					],
				}),
			],
			environment: {
				ACCOUNTS_TABLE: accountsTable.table.tableName,
				ACCOUNT_USERS_TABLE: accountUsersTable.table.tableName,
				SPENDINGS_TABLE: spendingsTable.table.tableName,
				ACCOUNT_AUTOCOMPLETE_TABLE:
					accountAutoCompleteTable.table.tableName,
			},
			layers: [baseLayer],
		})

		new EventSourceMapping(this, 'EventSourceMapping', {
			eventSourceArn: aggregateEventsTable.table.tableStreamArn as string,
			target: l,
			startingPosition: StartingPosition.LATEST,
		})

		new LogGroup(this, 'LogGroup', {
			logGroupName: `/aws/lambda/${l.functionName}`,
			retention: RetentionDays.ONE_WEEK,
			removalPolicy: RemovalPolicy.DESTROY,
		})
	}
}
