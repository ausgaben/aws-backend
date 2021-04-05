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
	if (aggregate.transferToAccountId !== undefined) {
		item.transferToAccountId = { S: aggregate.transferToAccountId }
	} else {
		item.transferToAccountId = { remove: true }
	}
	return item
}
