import {
    _UnmarshalledAttributeValue,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import * as AggregateRepository from '../getById';
import { Aggregate, AggregateMeta } from '../Aggregate';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import { EntityNotFoundError } from '../../../errors/EntityNotFoundError';
import { DynamoDBItem } from './DynamoDBItem';
import { toMeta } from './toMeta';

export const getById = <A extends Aggregate>(
    dynamodb: DynamoDBClient,
    TableName: string,
    aggregateName: string,
    itemToAggregate: (item: DynamoDBItem, _meta: AggregateMeta) => A,
): AggregateRepository.getById<A> => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'aggregateRepository/dynamodb/getById()',
            errors,
        );
    });
    return async (aggregateId: string): Promise<A> => {
        aggregateId = UUIDv4.decode(aggregateId).getOrElseL(errors => {
            throw new ValidationFailedError(
                'aggregateRepository/dynamodb/getById()',
                errors,
            );
        });

        const { Item } = await dynamodb.send(
            new GetItemCommand({
                TableName,
                Key: {
                    aggregateId: {
                        S: aggregateId,
                    },
                },
            }),
        );
        if (!Item) {
            throw new EntityNotFoundError(`"${aggregateId}" not found!`);
        }
        return itemToAggregate(Item, toMeta(aggregateName, Item));
    };
};
