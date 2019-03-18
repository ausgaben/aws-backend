import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { AggregateEvent } from '../AggregateEvent';
import { Account, AccountAggregateName } from '../../account/Account';
import { parseRecord } from './parseRecord';
import { groupEvents } from './groupEvents';
import { applyAccountEvents } from '../presenter/applyAccountEvents';
import { getByUUID as getByUUIDDynamoDB } from '../aggregateRepository/dynamodb/getByUUID';
import { persist as persistDynamoDB } from '../aggregateRepository/dynamodb/persist';
import { findByUUID } from '../aggregateRepository/findByUUID';
import { processGroupedEvents } from './processGroupedEvents';
import { itemToAggregate as accountItemToAggregate } from '../../account/repository/dynamodb/itemToAggregate';

const db = new DynamoDBClient({});
const accountsTableName = process.env.ACCOUNTS_TABLE!;
const getByUUID = getByUUIDDynamoDB<Account>(
    db,
    accountsTableName,
    AccountAggregateName,
    accountItemToAggregate,
);
const findAggregate = findByUUID<Account>(getByUUID);
const persist = persistDynamoDB<Account>(db, accountsTableName, aggregate => ({
    name: {
        S: aggregate.name,
    },
    isSavingsAccount: {
        BOOL: aggregate.isSavingsAccount,
    },
}));

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    const events = event.Records.filter(
        ({ eventName, eventSource }) =>
            eventName === 'INSERT' && eventSource === 'aws:dynamodb',
    )
        .map(parseRecord)
        .filter(e => e !== undefined) as AggregateEvent[];

    const accountEvents = groupEvents(events, AccountAggregateName);

    await Promise.all([
        processGroupedEvents(
            accountEvents,
            applyAccountEvents,
            findAggregate,
            persist,
        ),
    ]);
};
