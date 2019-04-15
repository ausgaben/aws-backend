import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb-v2-node';
import { findByAccountId } from '../autoComplete/repository/dynamodb/findByAccountId';
import { persist } from '../autoComplete/repository/dynamodb/persist';
import { groupEvents } from '../eventsourcing/reducer/groupEvents';
import {
    SpendingCreatedEvent,
    SpendingCreatedEventName,
} from '../events/SpendingCreated';
import { SpendingAggregateName } from '../spending/Spending';
import { processEvents as processEventsForAutoComplete } from '../autoComplete/processEvents';

const db = new DynamoDBClient({});
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE!;
const accountAutoCompleteTable = process.env.ACCOUNT_AUTOCOMPLETE_TABLE!;

const findAutoCompleteByAccountId = findByAccountId(
    db,
    accountAutoCompleteTable,
);
const persistAutoComplete = persist(db, accountAutoCompleteTable);

// tslint:disable-next-line:no-floating-promises
(async () => {
    const { Items } = await db.send(
        new ScanCommand({
            TableName: aggregateEventsTableName,
            FilterExpression:
                'aggregateName = :aggregateName AND eventName = :eventName',
            ExpressionAttributeValues: {
                [`:aggregateName`]: {
                    S: SpendingAggregateName,
                },
                [`:eventName`]: {
                    S: SpendingCreatedEventName,
                },
            },
            ProjectionExpression: 'eventPayload',
        }),
    );

    const events = Items!.map(({ eventPayload }) => ({
        eventName: SpendingCreatedEventName,
        aggregateName: SpendingAggregateName,
        eventPayload: JSON.parse(eventPayload.S!),
    }));

    const spendingEventsByAccount = groupEvents<SpendingCreatedEvent>(
        events as SpendingCreatedEvent[],
        SpendingAggregateName,
        e =>
            e.eventName === SpendingCreatedEventName
                ? e.eventPayload.accountId
                : false,
    );

    await processEventsForAutoComplete(
        spendingEventsByAccount,
        findAutoCompleteByAccountId,
        persistAutoComplete,
    );
})();