import * as path from 'path'
import { LayeredLambdas } from '@nordicsemiconductor/package-layered-lambdas'
import { packLayeredLambdasForCloudFormation } from '../packLambdas'

export type AusgabenLayeredLambdas = LayeredLambdas<{
	eventReducer: string
	createAccountMutation: string
	deleteAccountMutation: string
	accountsQuery: string
	createSpendingMutation: string
	updateSpendingMutation: string
	updateAccountMutation: string
	deleteSpendingMutation: string
	spendingsQuery: string
	inviteUserMutation: string
	autoCompleteStringsQuery: string
	exchangeRateQuery: string
	sparebank1OAuthCallback: string
	sparebank1accounts: string
	sparebank1transactions: string
}>

export const lambdas = async (
	rootDir: string,
	outDir: string,
	Bucket: string,
): Promise<AusgabenLayeredLambdas> =>
	packLayeredLambdasForCloudFormation('ausgaben', outDir, Bucket, {
		eventReducer: path.resolve(
			rootDir,
			'eventsourcing',
			'reducer',
			'eventReducer.ts',
		),
		createAccountMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'createAccount.ts',
		),
		deleteAccountMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'deleteAccount.ts',
		),
		accountsQuery: path.resolve(
			rootDir,
			'appsync',
			'queries',
			'accounts.ts',
		),
		createSpendingMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'createSpending.ts',
		),
		updateSpendingMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'updateSpending.ts',
		),
		updateAccountMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'updateAccount.ts',
		),
		deleteSpendingMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'deleteSpending.ts',
		),
		spendingsQuery: path.resolve(
			rootDir,
			'appsync',
			'queries',
			'spendings.ts',
		),
		inviteUserMutation: path.resolve(
			rootDir,
			'appsync',
			'mutations',
			'inviteUser.ts',
		),
		autoCompleteStringsQuery: path.resolve(
			rootDir,
			'appsync',
			'queries',
			'autoComplete.ts',
		),
		exchangeRateQuery: path.resolve(
			rootDir,
			'appsync',
			'queries',
			'exchangeRate.ts',
		),
		sparebank1OAuthCallback: path.resolve(
			rootDir,
			'sparebank1',
			'appsync',
			'mutations',
			'oAuthCallback.ts',
		),
		sparebank1accounts: path.resolve(
			rootDir,
			'sparebank1',
			'appsync',
			'queries',
			'accounts.ts',
		),
		sparebank1transactions: path.resolve(
			rootDir,
			'sparebank1',
			'appsync',
			'queries',
			'transactions.ts',
		),
	})
