import { AggregateMeta } from '../../../eventsourcing/aggregateRepository/Aggregate'
import { AccountUser } from '../../AccountUser'
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'

export const itemToAggregate = (
	item: DynamoDBItem,
	_meta: AggregateMeta,
): AccountUser => ({
	accountId: item.accountId.S as string,
	userId: item.userId.S as string,
	_meta,
})
