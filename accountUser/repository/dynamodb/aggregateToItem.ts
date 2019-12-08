import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'
import { AccountUser } from '../../AccountUser'

export const aggregateToItem = (aggregate: AccountUser): DynamoDBItem => ({
	accountId: {
		S: aggregate.accountId,
	},
	userId: {
		S: aggregate.userId,
	},
})
