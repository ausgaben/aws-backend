import { DynamoDBItem } from './DynamoDBItem';
import { AggregateMeta } from '../Aggregate';

export const toMeta = (
    aggregateName: string,
    Item: DynamoDBItem,
): AggregateMeta => ({
    name: aggregateName,
    uuid: Item.aggregateUUID.S!,
    createdAt: new Date(Item.createdAt.S!),
    updatedAt: Item.updatedAt ? new Date(Item.updatedAt.S!) : undefined,
    deletedAt: Item.deletedAt ? new Date(Item.deletedAt.S!) : undefined,
    version: +Item.version.N!,
});
