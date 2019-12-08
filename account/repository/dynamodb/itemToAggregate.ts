import { AggregateMeta } from '../../../eventsourcing/aggregateRepository/Aggregate'
import { Account } from '../../Account'
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem'
import { EUR, findCurrencyById } from '../../../currency/currencies'

export const itemToAggregate = (
	item: DynamoDBItem,
	_meta: AggregateMeta,
): Account => ({
	name: item.name.S as string,
	isSavingsAccount: item.isSavingsAccount.BOOL as boolean,
	defaultCurrency: (dc => (dc ? findCurrencyById(dc) || EUR : EUR))(
		item.defaultCurrencyId?.S,
	),
	_meta,
})
