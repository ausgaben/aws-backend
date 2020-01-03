import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node'
import { GQLError } from '../GQLError'
import { findByAccountId } from '../../spending/repository/dynamodb/findByAccountId'
import { canAccessAccount } from '../../accountUser/canAccessAccount'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { currencies } from '../../currency/currencies'
import { decodeStartKey, encodeStartKey } from '../startKey'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string
const spendingsTable = process.env.SPENDINGS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)
const findSpendingsByAccountId = findByAccountId(db, spendingsTable)

const checkAccess = canAccessAccount(findAccountUserByUserId)

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
		filter?: {}
		startDate: string
		endDate: string
		startKey?: string
	},
	context: Context,
) => {
	try {
		const canAccess = await checkAccess({
			userId: event.cognitoIdentityId,
			accountId: event.accountId,
		})
		if (isLeft(canAccess)) return GQLError(context, canAccess.left)
		const { items, nextStartKey } = await findSpendingsByAccountId({
			startDate: new Date(event.startDate),
			endDate: new Date(event.endDate),
			accountId: event.accountId,
			startKey: decodeStartKey(event.startKey),
		})
		return {
			items: items.map(item => ({
				...item,
				bookedAt: item.bookedAt.toISOString(),
				currency: currencies.find(({ id }) => item.currencyId === id),
			})),
			nextStartKey: encodeStartKey(nextStartKey),
		}
	} catch (error) {
		return GQLError(context, error)
	}
}
