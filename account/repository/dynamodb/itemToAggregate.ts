import { _UnmarshalledAttributeValue } from '@aws-sdk/client-dynamodb-v2-node';
import { AggregateMeta } from '../../../eventsourcing/aggregateRepository/Aggregate';

type DynamoDBItem = {
    [key: string]: _UnmarshalledAttributeValue;
};

export const itemToAggregate = (item: DynamoDBItem, $meta: AggregateMeta) => ({
    name: item.name.S!,
    isSavingsAccount: item.isSavingsAccount.BOOL!,
    $meta,
});
