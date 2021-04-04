import { Spending } from '../../Spending'
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'

export const aggregateToItem = (aggregate: Spending): DynamoDBItem => {
	const item: DynamoDBItem = {
		accountId: {
			S: aggregate.accountId,
		},
		bookedAt: {
			S: aggregate.bookedAt.toISOString(),
		},
		booked: {
			BOOL: aggregate.booked,
		},
		category: {
			S: aggregate.category,
		},
		description: {
			S: aggregate.description,
		},
		amount: {
			N: `${aggregate.amount}`,
		},
		currencyId: {
			S: aggregate.currencyId,
		},
	}
	if (aggregate.savingForAccountId !== undefined) {
		item.savingForAccountId = { S: aggregate.savingForAccountId }
	}
	return item
}
