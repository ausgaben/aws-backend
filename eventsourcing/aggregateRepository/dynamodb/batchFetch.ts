import {
    DynamoDBClient,
    BatchGetItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import { PaginatedResult } from '../PaginatedResult';
import { DynamoDBItem } from './DynamoDBItem';
import { Aggregate, AggregateMeta } from '../Aggregate';
import { toMeta } from './toMeta';

const aggregateFields = [
    'aggregateId',
    'version',
    'createdAt',
    'updatedAt',
    'deletedAt',
];

export const batchFetch = async <A extends Aggregate>(
    dynamodb: DynamoDBClient,
    TableName: string,
    aggregateName: string,
    fields: string[],
    itemToAggregate: (item: DynamoDBItem, _meta: AggregateMeta) => A,
    keys: DynamoDBItem[] = [],
    nextStartKey?: any,
): Promise<PaginatedResult<A>> => {
    const items = keys.length
        ? (
              await dynamoBatchGetItems(
                  dynamodb,
                  TableName,
                  [...new Set([...fields, ...aggregateFields])],
                  keys,
              )
          ).map(item => itemToAggregate(item, toMeta(aggregateName, item)))
        : [];

    // Sort items by given keys, so the returned list is stable.
    // DynamoDB BatchGetItems does not guarantee the order of returned values
    const sortedItems = keys.map(
        ({ aggregateId: { S: id } }) =>
            items.find(item => item._meta.id === id)!,
    );

    return {
        items: sortedItems,
        nextStartKey,
    };
};

const dynamoBatchGetItems = (
    dynamodb: DynamoDBClient,
    TableName: string,
    fields: string[],
    Keys: DynamoDBItem[],
): Promise<DynamoDBItem[]> =>
    dynamodb
        .send(
            new BatchGetItemCommand({
                RequestItems: {
                    [TableName]: {
                        ProjectionExpression: fields
                            .map(key => `#${key}`)
                            .join(','),
                        ExpressionAttributeNames: fields.reduce(
                            (map, key) => {
                                map[`#${key}`] = key;
                                return map;
                            },
                            {} as {
                                [key: string]: string;
                            },
                        ),
                        Keys,
                    },
                },
            }),
        )
        .then(({ Responses }) => Responses![TableName]);
