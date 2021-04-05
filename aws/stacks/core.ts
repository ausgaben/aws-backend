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
import { Sparebank1ImportFeature } from '../../sparebank1/aws/sparebank1Import'

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
			code: Code.fromBucket(sourceCodeBucket, baseLayerZipFileName),
			compatibleRuntimes: [Runtime.NODEJS_14_X],
		})

		new EventSourcingFeature(
			this,
			'eventsourcing',
			Code.fromBucket(
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
				createAccountMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.createAccountMutation,
				),
				deleteAccountMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.deleteAccountMutation,
				),
				accountsQuery: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.accountsQuery,
				),
				createSpendingMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.createSpendingMutation,
				),
				updateSpendingMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.updateSpendingMutation,
				),
				updateAccountMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.updateAccountMutation,
				),
				deleteSpendingMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.deleteSpendingMutation,
				),
				spendingsQuery: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.spendingsQuery,
				),
				inviteUserMutation: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.inviteUserMutation,
				),
				autoCompleteStringsQuery: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.autoCompleteStringsQuery,
				),
				exchangeRateQuery: Code.fromBucket(
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

		const sparebank1Import = new Sparebank1ImportFeature(
			this,
			'sparebank1Import',
			{
				sparebank1OAuthCallback: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.sparebank1OAuthCallback,
				),
				sparebank1accounts: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.sparebank1accounts,
				),
				sparebank1transactions: Code.fromBucket(
					sourceCodeBucket,
					layeredLambdas.lambdaZipFileNames.sparebank1transactions,
				),
			},
			baseLayer,
			this.aggregateEventsTable,
			api,
		)

		new CfnOutput(this, 'sparebank1Import:tokensTableName', {
			value: sparebank1Import.tokensTable.table.tableName,
			exportName: `${this.stackName}:sparebank1Import:tokensTableName`,
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
