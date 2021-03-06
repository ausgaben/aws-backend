import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist'
import { createAccount } from '../../commands/createAccount'
import { GQLError } from '../GQLError'
import { createAccountUser } from '../../commands/createAccountUser'
import { EUR } from '../../currency/currencies'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE as string

const persist = persistDynamoDB(db, aggregateEventsTableName)
const create = createAccount(persist)
const addUserToAccount = createAccountUser(persist)

export const handler = async (
	event: {
		cognitoIdentityId: string
		name: string
		isSavingsAccount?: boolean
		defaultCurrencyId?: string
	},
	context: Context,
): Promise<{ id: string } | ReturnType<typeof GQLError>> => {
	const createdAccount = await create({
		name: event.name,
		isSavingsAccount: event.isSavingsAccount === true,
		userId: event.cognitoIdentityId,
		defaultCurrencyId: event.defaultCurrencyId ?? EUR.id,
	})
	if (isLeft(createdAccount)) return GQLError(context, createdAccount.left)
	const e = createdAccount.right
	const addedUser = await addUserToAccount({
		userId: event.cognitoIdentityId,
		accountId: e.aggregateId,
	})
	if (isLeft(addedUser)) return GQLError(context, addedUser.left)
	return {
		id: e.aggregateId,
	}
}
