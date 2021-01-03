import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist'
import { GQLError } from '../GQLError'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { getById } from '../../eventsourcing/aggregateRepository/dynamodb/getById'
import { itemToAggregate as spendingItemToAggregate } from '../../spending/repository/dynamodb/itemToAggregate'
import { SpendingAggregateName } from '../../spending/Spending'
import { updateSpending } from '../../commands/updateSpending'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE as string
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string
const spendingsTableName = process.env.SPENDINGS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)
const getSpendingById = getById(
	db,
	spendingsTableName,
	SpendingAggregateName,
	spendingItemToAggregate,
)
const persist = persistDynamoDB(db, aggregateEventsTableName)

const update = updateSpending(persist, getSpendingById, findAccountUserByUserId)

export const handler = async (
	event: {
		cognitoIdentityId: string
		spendingId: string
		booked?: boolean
	},
	context: Context,
): Promise<boolean | ReturnType<typeof GQLError>> => {
	const updated = await update({
		spendingId: event.spendingId,
		userId: event.cognitoIdentityId,
		booked: event.booked,
	})
	if (isLeft(updated)) return GQLError(context, updated.left)
	return true
}
