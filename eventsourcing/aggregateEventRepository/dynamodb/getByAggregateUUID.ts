import {
    _UnmarshalledAttributeValue,
    DynamoDBClient,
    QueryCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import { PersistedEvent } from '../PersistedEvent';
import * as AggregateEventRepository from '../getByAggregateUUID';
import { DynamoDBItem } from '../../aggregateRepository/dynamodb/DynamoDBItem';

const fetchEvents = async (
    dynamodb: DynamoDBClient,
    TableName: string,
    aggregateUUID: string,
    events: DynamoDBItem[] = [],
    ExclusiveStartKey?: DynamoDBItem,
): Promise<DynamoDBItem[]> => {
    const { Items, LastEvaluatedKey } = await dynamodb.send(
        new QueryCommand({
            TableName,
            ExclusiveStartKey,
            KeyConditionExpression:
                'aggregateUUID = :aggregateUUID AND insertedAtNanotime > :insertedAtNanotime',
            ExpressionAttributeValues: {
                ':aggregateUUID': { S: aggregateUUID },
                ':insertedAtNanotime': { N: '0' },
            },
        }),
    );
    if (Items) {
        events = events.concat(Items);
    }
    if (LastEvaluatedKey) {
        return fetchEvents(
            dynamodb,
            TableName,
            aggregateUUID,
            events,
            LastEvaluatedKey,
        );
    }
    return events;
};

export const getByAggregateUUID = (
    dynamodb: DynamoDBClient,
    TableName: string,
): AggregateEventRepository.getByAggregateUUID => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'aggregateEventRepository/dynamodb/getByAggregateUUID()',
            errors,
        );
    });
    return async (aggregateUUID: string): Promise<PersistedEvent[]> => {
        aggregateUUID = UUIDv4.decode(aggregateUUID).getOrElseL(errors => {
            throw new ValidationFailedError(
                'aggregateEventRepository/dynamodb/getByAggregateUUID()',
                errors,
            );
        });

        const events = await fetchEvents(dynamodb, TableName, aggregateUUID);

        return events.map(event => ({
            eventUUID: event.eventUUID.S!,
            eventName: event.eventName.S!,
            eventCreatedAt: new Date(event.eventCreatedAt.S!),
            insertedAtNanotime: event.insertedAtNanotime.N!,
            aggregateName: event.aggregateName.S!,
            aggregateUUID: event.aggregateUUID.S!,
            eventPayload: event.eventPayload
                ? JSON.parse(event.eventPayload.S!)
                : undefined,
        }));
    };
};
