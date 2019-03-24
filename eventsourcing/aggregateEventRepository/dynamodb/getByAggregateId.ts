import {
    _UnmarshalledAttributeValue,
    DynamoDBClient,
    QueryCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import { PersistedEvent } from '../PersistedEvent';
import * as AggregateEventRepository from '../getByAggregateId';
import { DynamoDBItem } from '../../aggregateRepository/dynamodb/DynamoDBItem';

const fetchEvents = async (
    dynamodb: DynamoDBClient,
    TableName: string,
    aggregateId: string,
    events: DynamoDBItem[] = [],
    ExclusiveStartKey?: DynamoDBItem,
): Promise<DynamoDBItem[]> => {
    const { Items, LastEvaluatedKey } = await dynamodb.send(
        new QueryCommand({
            TableName,
            ExclusiveStartKey,
            KeyConditionExpression:
                'aggregateId = :aggregateId AND insertedAtNanotime > :insertedAtNanotime',
            ExpressionAttributeValues: {
                ':aggregateId': { S: aggregateId },
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
            aggregateId,
            events,
            LastEvaluatedKey,
        );
    }
    return events;
};

export const getByAggregateId = (
    dynamodb: DynamoDBClient,
    TableName: string,
): AggregateEventRepository.getByAggregateId => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'aggregateEventRepository/dynamodb/getByAggregateId()',
            errors,
        );
    });
    return async (aggregateId: string): Promise<PersistedEvent[]> => {
        aggregateId = UUIDv4.decode(aggregateId).getOrElseL(errors => {
            throw new ValidationFailedError(
                'aggregateEventRepository/dynamodb/getByAggregateId()',
                errors,
            );
        });

        const events = await fetchEvents(dynamodb, TableName, aggregateId);

        return events.map(event => ({
            eventId: event.eventId.S!,
            eventName: event.eventName.S!,
            eventCreatedAt: new Date(event.eventCreatedAt.S!),
            insertedAtNanotime: event.insertedAtNanotime.N!,
            aggregateName: event.aggregateName.S!,
            aggregateId: event.aggregateId.S!,
            eventPayload: event.eventPayload
                ? JSON.parse(event.eventPayload.S!)
                : undefined,
        }));
    };
};
