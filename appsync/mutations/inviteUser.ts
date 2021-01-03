import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist'
import { GQLError } from '../GQLError'
import { createAccountUser } from '../../commands/createAccountUser'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { AccessDeniedError } from '../../errors/AccessDeniedError'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE as string
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)

const persist = persistDynamoDB(db, aggregateEventsTableName)
const addUserToAccount = createAccountUser(persist)

export const handler = async (
	event: {
		cognitoIdentityId: string
		userId: string
		accountId: string
	},
	context: Context,
): Promise<{ id: string } | ReturnType<typeof GQLError>> => {
	const userAccounts = await findAccountUserByUserId(event.cognitoIdentityId)
	const accountUser = userAccounts.items.find(
		({ accountId: a }) => a === event.accountId,
	)
	if (!accountUser) {
		return GQLError(
			context,
			new AccessDeniedError(
				`User "${event.cognitoIdentityId}" is not allowed to access account "${event.accountId}"!`,
			),
		)
	}
	const e = await addUserToAccount({
		userId: event.userId,
		accountId: event.accountId,
	})
	if (isLeft(e)) return GQLError(context, e.left)
	return {
		id: e.right.aggregateId,
	}
}
