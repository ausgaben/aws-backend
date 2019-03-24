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
    items?: DynamoDBItem[],
    nextStartKey?: any,
): Promise<PaginatedResult<A>> => ({
    items:
        items && items.length
            ? (await dynamoBatchGetItems(
                  dynamodb,
                  TableName,
                  [...new Set([...fields, ...aggregateFields])],
                  items,
              )).map(item => itemToAggregate(item, toMeta(aggregateName, item)))
            : [],
    nextStartKey,
});

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
                        Keys: Keys.map(({ aggregateId }) => ({
                            aggregateId,
                        })),
                    },
                },
            }),
        )
        .then(({ Responses }) => Responses![TableName]);
