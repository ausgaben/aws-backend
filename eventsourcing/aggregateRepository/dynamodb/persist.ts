import {
    _AttributeValue,
    DynamoDBClient,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import * as AggregateRepository from '../../aggregateRepository/persist';
import { Aggregate } from '../Aggregate';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { ConflictError } from '../../../errors/ConflictError';

type DynamoDBItem = {
    [key: string]: _AttributeValue;
};

const reservedItemKeys = [
    'aggregateUUID',
    'version',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'nextversion',
];

export const persist = <A extends Aggregate>(
    dynamodb: DynamoDBClient,
    TableName: string,
    aggregateToItem: (aggregate: A) => DynamoDBItem,
): AggregateRepository.persist<A> => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'aggregateRepository/dynamodb/persist()',
            errors,
        );
    });
    return async (aggregate: A): Promise<void> => {
        const Item = aggregateToItem(aggregate);
        const itemKeys = Object.keys(Item);
        itemKeys.forEach(key => {
            if (reservedItemKeys.includes(key)) {
                throw new TypeError(
                    `aggregateRepository/dynamodb/persist(): Frozen item must not have key of ${reservedItemKeys.join(
                        ',',
                    )}!`,
                );
            }
        });
        const fields: string[] = [
            ...itemKeys.map(key => `#${key}`),
            '#version',
            '#createdAt',
        ];

        const values: DynamoDBItem = {
            ...Object.keys(Item).reduce(
                (o, k) => {
                    o[`:${k}`] = Item[k];
                    return o;
                },
                {} as DynamoDBItem,
            ),
            ':version': {
                N: `${aggregate.$meta.version}`,
            },
            ':createdAt': {
                S: aggregate.$meta.createdAt.toISOString(),
            },
        };
        if (aggregate.$meta.updatedAt) {
            fields.push('#updatedAt');
            values[':updatedAt'] = {
                S: aggregate.$meta.updatedAt
                    ? aggregate.$meta.updatedAt.toISOString()
                    : undefined,
            };
        }
        if (aggregate.$meta.deletedAt) {
            fields.push('#deletedAt');
            values[':deletedAt'] = {
                S: aggregate.$meta.deletedAt
                    ? aggregate.$meta.deletedAt.toISOString()
                    : '',
            };
        }
        let ConditionExpression;
        if (aggregate.$meta.version === 1) {
            ConditionExpression = 'attribute_not_exists(aggregateUUID)';
        } else {
            ConditionExpression = 'version < :nextversion';
            values[':nextversion'] = {
                N: `${aggregate.$meta.version}`,
            };
        }

        try {
            await dynamodb.send(
                new UpdateItemCommand({
                    TableName,
                    Key: {
                        aggregateUUID: {
                            S: aggregate.$meta.uuid,
                        },
                    },
                    UpdateExpression: `SET ${fields
                        .map(f => `${f} = :${f.substr(1)}`)
                        .join(',')}`,
                    ExpressionAttributeNames: fields.reduce(
                        (map, key) => {
                            map[key] = key.substr(1);
                            return map;
                        },
                        {} as {
                            [key: string]: string;
                        },
                    ),
                    ExpressionAttributeValues: values,
                    ConditionExpression,
                }),
            );
        } catch (error) {
            if (error.name === 'ConditionalCheckFailedException') {
                throw new ConflictError(
                    `Failed to persist "${aggregate.$meta.uuid}"!`,
                );
            }
            throw error;
        }
    };
};
