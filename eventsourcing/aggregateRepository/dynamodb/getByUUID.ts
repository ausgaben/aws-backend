import {
    _UnmarshalledAttributeValue,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import * as AggregateRepository from '../../aggregateRepository/getByUUID';
import { Aggregate, AggregateMeta } from '../Aggregate';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import { EntityNotFoundError } from '../../../errors/EntityNotFoundError';

type DynamoDBItem = {
    [key: string]: _UnmarshalledAttributeValue;
};

export const getByUUID = <A extends Aggregate>(
    dynamodb: DynamoDBClient,
    TableName: string,
    aggregateName: string,
    itemToAggregate: (item: DynamoDBItem, $meta: AggregateMeta) => A,
): AggregateRepository.getByUUID<A> => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'aggregateRepository/dynamodb/getByAggregateUUID()',
            errors,
        );
    });
    return async (aggregateUUID: string): Promise<A> => {
        aggregateUUID = UUIDv4.decode(aggregateUUID).getOrElseL(errors => {
            throw new ValidationFailedError(
                'aggregateRepository/dynamodb/getByAggregateUUID()',
                errors,
            );
        });

        const { Item } = await dynamodb.send(
            new GetItemCommand({
                TableName,
                Key: {
                    aggregateUUID: {
                        S: aggregateUUID,
                    },
                },
            }),
        );
        if (!Item) {
            throw new EntityNotFoundError(`"${aggregateUUID}" not found!`);
        }
        return itemToAggregate(Item, {
            name: aggregateName,
            uuid: aggregateUUID,
            createdAt: new Date(Item.createdAt.S!),
            updatedAt: Item.updatedAt ? new Date(Item.updatedAt.S!) : undefined,
            deletedAt: Item.deletedAt ? new Date(Item.deletedAt.S!) : undefined,
            version: +Item.version.N!,
        });
    };
};
