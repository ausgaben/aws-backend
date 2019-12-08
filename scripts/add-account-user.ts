import { createAccountUser } from '../commands/createAccountUser'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node'
import { persist as persistDynamoDB } from '../eventsourcing/aggregateEventRepository/dynamodb/persist'

const db = new DynamoDBClient({})
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE as string

const persist = persistDynamoDB(db, aggregateEventsTableName)
const addAcountUser = createAccountUser(persist)

;(async () => {
	await addAcountUser({
		accountId: process.argv[process.argv.length - 1],
		userId: process.argv[process.argv.length - 2],
	})
})().catch(err => {
	console.error(err.message)
	process.exit(1)
})