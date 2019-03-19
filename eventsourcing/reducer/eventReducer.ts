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
import { itemToAggregate as accountUserItemToAggregate } from '../../accountUser/repository/dynamodb/itemToAggregate';
import {
    AccountUser,
    AccountUserAggregateName,
} from '../../accountUser/AccountUser';
import { applyAccountUserEvents } from '../presenter/applyAccountUserEvents';

const db = new DynamoDBClient({});
const accountsTableName = process.env.ACCOUNTS_TABLE!;
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE!;

const getAccountByUUID = getByUUIDDynamoDB<Account>(
    db,
    accountsTableName,
    AccountAggregateName,
    accountItemToAggregate,
);
const findAccountAggregate = findByUUID<Account>(getAccountByUUID);
const persistAccount = persistDynamoDB<Account>(
    db,
    accountsTableName,
    aggregate => ({
        name: {
            S: aggregate.name,
        },
        isSavingsAccount: {
            BOOL: aggregate.isSavingsAccount,
        },
    }),
);

const getAccountUserByUUID = getByUUIDDynamoDB<AccountUser>(
    db,
    accountUsersTableName,
    AccountUserAggregateName,
    accountUserItemToAggregate,
);
const findAccountUserAggregate = findByUUID<AccountUser>(getAccountUserByUUID);
const persistAccountUser = persistDynamoDB<AccountUser>(
    db,
    accountUsersTableName,
    aggregate => ({
        accountId: {
            S: aggregate.accountId,
        },
        userId: {
            S: aggregate.userId,
        },
    }),
);

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    const events = event.Records.filter(
        ({ eventName, eventSource }) =>
            eventName === 'INSERT' && eventSource === 'aws:dynamodb',
    )
        .map(parseRecord)
        .filter(e => e !== undefined) as AggregateEvent[];

    const accountEvents = groupEvents(events, AccountAggregateName);
    const accountUserEvents = groupEvents(events, AccountUserAggregateName);

    await Promise.all([
        processGroupedEvents(
            accountEvents,
            applyAccountEvents,
            findAccountAggregate,
            persistAccount,
        ),
        processGroupedEvents(
            accountUserEvents,
            applyAccountUserEvents,
            findAccountUserAggregate,
            persistAccountUser,
        ),
    ]);
};
