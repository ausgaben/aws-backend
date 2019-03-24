import { AggregateMeta } from '../../../eventsourcing/aggregateRepository/Aggregate';
import { Spending } from '../../Spending';
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem';

export const itemToAggregate = (
    item: DynamoDBItem,
    _meta: AggregateMeta,
): Spending => ({
    accountId: item.accountId.S!,
    bookedAt: new Date(item.bookedAt.S!),
    category: item.category.S!,
    description: item.description.S!,
    amount: +item.amount.N!,
    currencyId: item.currencyId.S!,
    isIncome: item.isIncome.BOOL!,
    isPending: item.isPending.BOOL!,
    paidWith: item.paidWith ? item.paidWith.S! : undefined,
    _meta,
});
