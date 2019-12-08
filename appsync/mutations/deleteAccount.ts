import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node'
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist'
import { GQLError } from '../GQLError'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { getById } from '../../eventsourcing/aggregateRepository/dynamodb/getById'
import { AccountAggregateName } from '../../account/Account'
import { itemToAggregate as accountItemToAggregate } from '../../account/repository/dynamodb/itemToAggregate'
import { itemToAggregate as accountUserItemToAggregate } from '../../accountUser/repository/dynamodb/itemToAggregate'
import { deleteAccount } from '../../commands/deleteAccount'
import { deleteAccountUser } from '../../commands/deleteAccountUser'
import { AccountUserAggregateName } from '../../accountUser/AccountUser'

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
const getAccountUserById = getById(
	db,
	accountUsersTableName,
	AccountUserAggregateName,
	accountUserItemToAggregate,
)
const persist = persistDynamoDB(db, aggregateEventsTableName)

const removeAccountUser = deleteAccountUser(persist, getAccountUserById)
const remove = deleteAccount(
	persist,
	getAccountById,
	findAccountUserByUserId,
	async args =>
		removeAccountUser({ accountUserId: args.accountUser._meta.id }),
)

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
	},
	context: Context,
) => {
	try {
		await remove({
			accountId: event.accountId,
			userId: event.cognitoIdentityId,
		})
		return true
	} catch (error) {
		return GQLError(context, error)
	}
}
