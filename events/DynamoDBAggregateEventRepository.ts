import {
    DynamoDBClient,
    PutItemCommand,
    QueryCommand,
    _UnmarshalledAttributeValue,
} from '@aws-sdk/client-dynamodb-v2-node';
import { PersistedEvent } from './AggregateEventRepository';
import { AggregateEvent, AggregateEventWithPayload } from './AggregateEvent';
import { NonEmptyString } from '../validation/NonEmptyString';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import * as EventRepository from './AggregateEventRepository';
import { UUIDv4 } from '../validation/UUIDv4';

const startHrtime = process.hrtime();
const startTime = Date.now();

const nanotime = (): string => {
    const diff = process.hrtime(startHrtime);
    return `${startTime + diff[0] * 1000}${diff[1]
        .toString()
        .padStart(9, '0')}`;
};

export const persist = (
    dynamodb: DynamoDBClient,
    TableName: string,
): EventRepository.persist => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'DynamoDBAggregateEventRepository.persist()',
            errors,
        );
    });

    return async (
        event: AggregateEvent | AggregateEventWithPayload,
    ): Promise<void> => {
        const {
            eventUUID,
            aggregateName,
            aggregateUUID,
            eventName,
            eventCreatedAt,
        } = event;

        const Item: any = {
            eventUUID: {
                S: eventUUID,
            },
            eventName: {
                S: eventName,
            },
            eventCreatedAt: {
                S: `${eventCreatedAt.toISOString()}`,
            },
            aggregateUUID: {
                S: aggregateUUID,
            },
            aggregateName: {
                S: aggregateName,
            },
            insertedAtNanotime: {
                N: `${nanotime()}`,
            },
        };

        if ((<AggregateEventWithPayload>event).eventPayload) {
            Item.eventPayload = {
                S: JSON.stringify(
                    (<AggregateEventWithPayload>event).eventPayload,
                ),
            };
        }

        await dynamodb.send(
            new PutItemCommand({
                TableName,
                Item,
            }),
        );
    };
};

type DynamoDBItem = {
    [key: string]: _UnmarshalledAttributeValue;
};

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
): EventRepository.getByAggregateUUID => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'DynamoDBAggregateEventRepository.getByAggregateUUID()',
            errors,
        );
    });
    return async (aggregateUUID: string): Promise<PersistedEvent[]> => {
        aggregateUUID = UUIDv4.decode(aggregateUUID).getOrElseL(errors => {
            throw new ValidationFailedError(
                'DynamoDBAggregateEventRepository.getByAggregateUUID()',
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
