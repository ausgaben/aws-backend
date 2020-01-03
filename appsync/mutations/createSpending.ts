import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node'
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist'
import { createSpending } from '../../commands/createSpending'
import { GQLError } from '../GQLError'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE as string
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)
const persist = persistDynamoDB(db, aggregateEventsTableName)
const create = createSpending(persist, findAccountUserByUserId)

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
		bookedAt: string
		category: string
		description: string
		amount: number
		currencyId: string
		booked: boolean
		paidWith?: string
	},
	context: Context,
) => {
	const createdSpending = await create({
		userId: event.cognitoIdentityId,
		...event,
	})
	if (isLeft(createdSpending)) return GQLError(context, createdSpending.left)
	return {
		id: createdSpending.right.aggregateId,
	}
}
