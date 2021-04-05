import { DynamoDBItemWithRemovableProperties } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'
import { Spending } from '../../Spending'

export const aggregateToItem = (
	aggregate: Spending,
): DynamoDBItemWithRemovableProperties => {
	const item: DynamoDBItemWithRemovableProperties = {
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
	} else {
		item.savingForAccountId = { remove: true }
	}
	return item
}
