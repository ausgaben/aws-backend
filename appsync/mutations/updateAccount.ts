import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist'
import { GQLError } from '../GQLError'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { getById } from '../../eventsourcing/aggregateRepository/dynamodb/getById'
import { itemToAggregate as accountItemToAggregate } from '../../account/repository/dynamodb/itemToAggregate'
import { AccountAggregateName } from '../../account/Account'
import { updateAccount } from '../../commands/updateAccount'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE as string
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string
const accountsTableName = process.env.ACCOUNTS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)
const getAccountById = getById(
	db,
	accountsTableName,
	AccountAggregateName,
	accountItemToAggregate,
)
const persist = persistDynamoDB(db, aggregateEventsTableName)

const update = updateAccount(persist, getAccountById, findAccountUserByUserId)

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
		name: string
		defaultCurrencyId?: string
		expectedVersion: number
	},
	context: Context,
): Promise<boolean | ReturnType<typeof GQLError>> => {
	console.log({ event })
	const updated = await update({
		accountId: event.accountId,
		userId: event.cognitoIdentityId,
		name: event.name,
		defaultCurrencyId: event.defaultCurrencyId,
		expectedVersion: event.expectedVersion,
	})
	if (isLeft(updated)) return GQLError(context, updated.left)
	return true
}
