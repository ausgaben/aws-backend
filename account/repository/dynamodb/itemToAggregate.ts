import { AggregateMeta } from '../../../eventsourcing/aggregateRepository/Aggregate';
import { Account } from '../../Account';
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem';

export const itemToAggregate = (
    item: DynamoDBItem,
    _meta: AggregateMeta,
): Account => ({
    name: item.name.S!,
    isSavingsAccount: item.isSavingsAccount.BOOL!,
    _meta,
});
