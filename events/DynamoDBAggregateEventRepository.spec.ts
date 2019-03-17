import * as DynamoDBAggregateEventRepository from './DynamoDBAggregateEventRepository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { AggregateEventWithPayload } from './AggregateEvent';
import { v4 } from 'uuid';

jest.setTimeout(60000);

const db = new DynamoDBClient({});
const TableName = process.env.AGGREGATES_EVENTS_TABLE!;
const persist = DynamoDBAggregateEventRepository.persist(
    db,
    process.env.AGGREGATES_EVENTS_TABLE!,
);
const getByAggregateUUID = DynamoDBAggregateEventRepository.getByAggregateUUID(
    db,
    TableName,
);

describe('DynamoDBAggregateEventRepository', () => {
    if (!process.env.AGGREGATES_EVENTS_TABLE) {
        test.only('skipped', () => {
            console.warn(
                'skipping tests (AGGREGATES_EVENTS_TABLE is not defined)',
            );
        });
    }
    test('persist()', async () => {
        const uuid = v4();
        const e: AggregateEventWithPayload = {
            eventUUID: v4(),
            eventName: 'foo',
            aggregateName: 'DummyEvent',
            aggregateUUID: uuid,
            eventPayload: { foo: ['bar'] },
            eventCreatedAt: new Date('2016-01-01T00:00:00Z'),
        };
        await persist(e);
        const events = await getByAggregateUUID(uuid);
        expect(events).toHaveLength(1);
        expect(events).toMatchObject([e]);
    });

    test('getByAggregateId()', async () => {
        const uuid = v4();
        await Promise.all(
            Array.apply(undefined, Array(10)).map(async (_, idx) =>
                persist({
                    eventUUID: v4(),
                    eventName: `Event_${idx + 1}`,
                    aggregateName: 'DummyEvent',
                    aggregateUUID: uuid,
                    eventPayload: { foo: ['bar'] },
                    eventCreatedAt: new Date('2016-01-01T00:00:00Z'),
                }),
            ),
        );
        const loadedEvents = await getByAggregateUUID(uuid);
        expect(loadedEvents).toHaveLength(10);
        expect(loadedEvents[0].eventName).toEqual('Event_1');
        expect(loadedEvents[0].eventPayload).toEqual({ foo: ['bar'] });
        expect(loadedEvents[9].eventName).toEqual('Event_10');
    });
});
