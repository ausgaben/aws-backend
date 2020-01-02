import { App, CfnOutput, Stack } from '@aws-cdk/core'
import { AggregateEventsTable } from '../resources/aggregate-events-table'
import { Cognito } from '../resources/cognito'
import { AccountsTable } from '../resources/accounts-table'
import { EventSourcingFeature } from '../features/eventsourcing'
import { Code, LayerVersion, Runtime } from '@aws-cdk/aws-lambda'
import { Bucket } from '@aws-cdk/aws-s3'
import { AusgabenLayeredLambdas } from '../resources/lambdas'
import { ApiFeature } from '../features/api'
import { AccountUsersTable } from '../resources/account-users-table'
import { ExchangeRatesTable } from '../resources/exchange-rates-table'
import { SpendingsTable } from '../resources/spendings-table'
import { AccountAutoCompleteTable } from '../resources/account-autoComplete-table'

export class CoreStack extends Stack {
	public readonly aggregateEventsTable: AggregateEventsTable
	public readonly accountsTable: AccountsTable
	public readonly accountUsersTable: AccountUsersTable
	public readonly spendingsTable: SpendingsTable
	public readonly accountAutoCompleteTable: AccountAutoCompleteTable
	public readonly exchangeRatesTable: ExchangeRatesTable
	public readonly cognito: Cognito

	constructor(
		parent: App,
		id: string,
		sourceCodeBucketName: string,
		baseLayerZipFileName: string,
		layeredLambdas: AusgabenLayeredLambdas,
	) {
		super(parent, id)

		this.aggregateEventsTable = new AggregateEventsTable(
			this,
			'aggregateEventsTable',
		)
		new CfnOutput(this, 'aggregateEventsTableName', {
			value: this.aggregateEventsTable.table.tableName,
			exportName: `${this.stackName}:aggregateEventsTableName`,
		})

		this.accountsTable = new AccountsTable(this, 'accountsTable')

		new CfnOutput(this, 'accountsTableName', {
			value: this.accountsTable.table.tableName,
			exportName: `${this.stackName}:accountsTableName`,
		})

		this.accountUsersTable = new AccountUsersTable(
			this,
			'accountUsersTable',
		)

		new CfnOutput(this, 'accountUsersTableName', {
			value: this.accountUsersTable.table.tableName,
			exportName: `${this.stackName}:accountUsersTableName`,
		})

		this.spendingsTable = new SpendingsTable(this, 'spendingsTable')

		new CfnOutput(this, 'spendingsTableName', {
			value: this.spendingsTable.table.tableName,
			exportName: `${this.stackName}:spendingsTableName`,
		})

		this.accountAutoCompleteTable = new AccountAutoCompleteTable(
			this,
			'accountAutoCompleteTable',
		)

		new CfnOutput(this, 'accountAutoCompleteTableName', {
			value: this.accountAutoCompleteTable.table.tableName,
			exportName: `${this.stackName}:accountAutoCompleteTableName`,
		})

		// Conversion rates

		this.exchangeRatesTable = new ExchangeRatesTable(
			this,
			'exchangeRatesTable',
		)

		new CfnOutput(this, 'exchangeRatesTableName', {
			value: this.exchangeRatesTable.table.tableName,
			exportName: `${this.stackName}:exchangeRatesTableName`,
		})

		this.cognito = new Cognito(this, 'cognito')

		new CfnOutput(this, 'userPoolId', {
			value: this.cognito.userPool.userPoolId,
			exportName: `${this.stackName}:userPoolId`,
		})

		new CfnOutput(this, 'identityPoolId', {
			value: this.cognito.identityPool.ref,
			exportName: `${this.stackName}:identityPoolId`,
		})

		new CfnOutput(this, 'userPoolClientId', {
			value: this.cognito.userPoolClient.userPoolClientId,
			exportName: `${this.stackName}:userPoolClientId`,
		})

		const sourceCodeBucket = Bucket.fromBucketName(
			this,
			'SourceCodeBucket',
			sourceCodeBucketName,
		)

		const baseLayer = new LayerVersion(this, `${id}-layer`, {
			code: Code.bucket(sourceCodeBucket, baseLayerZipFileName),
			compatibleRuntimes: [Runtime.NODEJS_12_X],
		})

		new EventSourcingFeature(
			this,
			'eventsourcing',
			Code.bucket(
				sourceCodeBucket,
				layeredLambdas.lambdaZipFileNames.eventReducer,
			),
			baseLayer,
			this.aggregateEventsTable,
			this.accountsTable,
			this.accountUsersTable,
			this.spendingsTable,
			this.accountAutoCompleteTable,
		)

		const api = new ApiFeature(
			this,
			'api',
			{
				createAccountMutation: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.createAccountMutation,
				),
				deleteAccountMutation: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.deleteAccountMutation,
				),
				accountsQuery: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.accountsQuery,
				),
				createSpendingMutation: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.createSpendingMutation,
				),
				updateSpendingMutation: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.updateSpendingMutation,
				),
				deleteSpendingMutation: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.deleteSpendingMutation,
				),
				spendingsQuery: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.spendingsQuery,
				),
				inviteUserMutation: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.inviteUserMutation,
				),
				autoCompleteStringsQuery: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.autoCompleteStringsQuery,
				),
				exchangeRateQuery: Code.bucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.exchangeRateQuery,
				),
			},
			baseLayer,
			this.aggregateEventsTable,
			this.accountsTable,
			this.accountUsersTable,
			this.spendingsTable,
			this.accountAutoCompleteTable,
			this.exchangeRatesTable,
			this.cognito.userRole,
		)

		new CfnOutput(this, 'apiUrl', {
			value: api.api.attrGraphQlUrl,
			exportName: `${this.stackName}:apiUrl`,
		})
	}
}

export type Outputs = {
	accountAutoCompleteTableName: string
	accountUsersTableName: string
	exchangeRatesTableName: string
	apiUrl: string
	userPoolClientId: string
	aggregateEventsTableName: string
	spendingsTableName: string
	accountsTableName: string
	userPoolId: string
	identityPoolId: string
}
