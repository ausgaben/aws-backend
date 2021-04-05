import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { GQLError } from '../GQLError'
import { findByAccountId } from '../../spending/repository/dynamodb/findByAccountId'
import { canAccessAccount } from '../../accountUser/canAccessAccount'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { currencies } from '../../currency/currencies'
import { decodeStartKey, encodeStartKey } from '../startKey'
import { isLeft } from 'fp-ts/lib/Either'
import { getById } from '../../eventsourcing/aggregateRepository/dynamodb/getById'
import { AccountAggregateName } from '../../account/Account'
import { itemToAggregate } from '../../account/repository/dynamodb/itemToAggregate'
import { GraphQLSpending } from '../types'

const db = new DynamoDBClient({})
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string
const accountsTableName = process.env.ACCOUNTS_TABLE as string
const spendingsTable = process.env.SPENDINGS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)
const findSpendingsByAccountId = findByAccountId(db, spendingsTable)
const getAccountById = getById(
	db,
	accountsTableName,
	AccountAggregateName,
	itemToAggregate,
)

const checkAccess = canAccessAccount(findAccountUserByUserId)

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
		filter?: Record<string, any>
		startDate: string
		endDate: string
		startKey?: string
	},
	context: Context,
): Promise<
	| {
			items: GraphQLSpending[]
			nextStartKey?: string
	  }
	| ReturnType<typeof GQLError>
> => {
	console.debug(JSON.stringify(event))
	try {
		const canAccess = await checkAccess({
			userId: event.cognitoIdentityId,
			accountId: event.accountId,
		})
		if (isLeft(canAccess)) return GQLError(context, canAccess.left)
		const [{ items, nextStartKey }, accounts] = await Promise.all([
			findSpendingsByAccountId({
				startDate: new Date(event.startDate),
				endDate: new Date(event.endDate),
				accountId: event.accountId,
				startKey: decodeStartKey(event.startKey),
			}),
			findAccountUserByUserId(
				event.cognitoIdentityId,
			).then(async ({ items }) =>
				Promise.all(
					items.map(async ({ accountId }) =>
						getAccountById(accountId),
					),
				),
			),
		])
		const result = {
			items: items.map((item) => ({
				...item,
				bookedAt: item.bookedAt.toISOString(),
				currency: currencies.find(({ id }) => item.currencyId === id),
				account: accounts.find(
					({ _meta: { id } }) => id === item.accountId,
				),
				transferToAccount: accounts.find(
					({ _meta: { id } }) => id === item.transferToAccountId,
				),
			})),
			nextStartKey: encodeStartKey(nextStartKey),
		}
		console.debug(JSON.stringify(result))
		return result
	} catch (error) {
		return GQLError(context, error)
	}
}
