import {
    DynamoDBClient,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import {
    AggregateEvent,
    AggregateEventWithPayload,
} from '../../AggregateEvent';

import * as AggregateEventRepository from '../persist';
import { getOrElseL } from '../../../fp-compat/getOrElseL';

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
): AggregateEventRepository.persist => {
    TableName = getOrElseL(NonEmptyString.decode(TableName))(errors => {
        throw new ValidationFailedError(
            'aggregateEventRepository/dynamodb/persist()',
            errors,
        );
    });

    return async (
        event: AggregateEvent | AggregateEventWithPayload,
    ): Promise<void> => {
        const {
            eventId,
            aggregateName,
            aggregateId,
            eventName,
            eventCreatedAt,
        } = event;

        const Item: any = {
            eventId: {
                S: eventId,
            },
            eventName: {
                S: eventName,
            },
            eventCreatedAt: {
                S: `${eventCreatedAt.toISOString()}`,
            },
            aggregateId: {
                S: aggregateId,
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
