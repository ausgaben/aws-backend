import { Account } from '../../Account'
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'

export const aggregateToItem = (aggregate: Account): DynamoDBItem => ({
	name: {
		S: aggregate.name,
	},
	isSavingsAccount: {
		BOOL: aggregate.isSavingsAccount,
	},
	defaultCurrencyId: {
		S: aggregate.defaultCurrency.id,
	},
})
