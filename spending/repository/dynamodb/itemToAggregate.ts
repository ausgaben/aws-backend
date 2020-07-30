import { AggregateMeta } from '../../../eventsourcing/aggregateRepository/Aggregate'
import { Spending } from '../../Spending'
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'

export const itemToAggregate = (
	item: DynamoDBItem,
	_meta: AggregateMeta,
): Spending => ({
	accountId: item.accountId.S as string,
	bookedAt: new Date(item.bookedAt.S as string),
	booked: item.booked.BOOL as boolean,
	category: item.category.S as string,
	description: item.description.S as string,
	amount: +(item.amount.N as string),
	currencyId: item.currencyId.S as string,
	_meta,
})
