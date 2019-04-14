import { DynamoDBStreamEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { AggregateEvent } from '../AggregateEvent';
import { Account, AccountAggregateName } from '../../account/Account';
import { parseRecord } from './parseRecord';
import { groupEvents } from './groupEvents';
import { applyEvents as applyAccountEvents } from '../../account/applyEvents';
import { getById as getByIdDynamoDB } from '../aggregateRepository/dynamodb/getById';
import { persist as persistDynamoDB } from '../aggregateRepository/dynamodb/persist';
import { remove as removeDynamoDB } from '../aggregateRepository/dynamodb/remove';
import { findById } from '../aggregateRepository/findById';
import { processGroupedEvents } from './processGroupedEvents';
import { itemToAggregate as accountItemToAggregate } from '../../account/repository/dynamodb/itemToAggregate';
import { aggregateToItem as accountToItem } from '../../account/repository/dynamodb/aggregateToItem';
import { itemToAggregate as accountUserItemToAggregate } from '../../accountUser/repository/dynamodb/itemToAggregate';
import { aggregateToItem as accountUserToItem } from '../../accountUser/repository/dynamodb/aggregateToItem';
import {
    AccountUser,
    AccountUserAggregateName,
} from '../../accountUser/AccountUser';
import { applyEvents as applyAccountUserEvents } from '../../accountUser/applyEvents';
import { Spending, SpendingAggregateName } from '../../spending/Spending';
import { itemToAggregate as spendingItemToAggregate } from '../../spending/repository/dynamodb/itemToAggregate';
import { aggregateToItem as spendingToItem } from '../../spending/repository/dynamodb/aggregateToItem';
import { applyEvents as applySpendingEvents } from '../../spending/applyEvents';
import { processEvents as processEventsForAutoComplete } from '../../autoComplete/processEvents';
import {
    SpendingCreatedEvent,
    SpendingCreatedEventName,
} from '../../events/SpendingCreated';
import { SpendingDeletedEvent } from '../../events/SpendingDeleted';
import { findByAccountId } from '../../autoComplete/repository/dynamodb/findByAccountId';
import { persist } from '../../autoComplete/repository/dynamodb/persist';

const db = new DynamoDBClient({});
const accountsTableName = process.env.ACCOUNTS_TABLE!;
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE!;
const spendingsTableName = process.env.SPENDINGS_TABLE!;
const accountAutoCompleteTable = process.env.ACCOUNT_AUTOCOMPLETE_TABLE!;

const getAccountById = getByIdDynamoDB<Account>(
    db,
    accountsTableName,
    AccountAggregateName,
    accountItemToAggregate,
);
const findAccountAggregate = findById<Account>(getAccountById);
const persistAccount = persistDynamoDB<Account>(
    db,
    accountsTableName,
    accountToItem,
);
const removeAccount = removeDynamoDB<Account>(db, accountsTableName);

const getAccountUserById = getByIdDynamoDB<AccountUser>(
    db,
    accountUsersTableName,
    AccountUserAggregateName,
    accountUserItemToAggregate,
);
const findAccountUserAggregate = findById<AccountUser>(getAccountUserById);
const persistAccountUser = persistDynamoDB<AccountUser>(
    db,
    accountUsersTableName,
    accountUserToItem,
);

const removeAccountUser = removeDynamoDB<AccountUser>(
    db,
    accountUsersTableName,
);

const getSpendingById = getByIdDynamoDB<Spending>(
    db,
    spendingsTableName,
    SpendingAggregateName,
    spendingItemToAggregate,
);
const findSpendingAggregate = findById<Spending>(getSpendingById);
const persistSpending = persistDynamoDB<Spending>(
    db,
    spendingsTableName,
    spendingToItem,
);

const removeSpending = removeDynamoDB<Spending>(db, spendingsTableName);

const findAutoCompleteByAccountId = findByAccountId(
    db,
    accountAutoCompleteTable,
);
const persistAutoComplete = persist(db, accountAutoCompleteTable);

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
    const events = event.Records.filter(
        ({ eventName, eventSource }) =>
            eventName === 'INSERT' && eventSource === 'aws:dynamodb',
    )
        .map(parseRecord)
        .filter(e => e !== undefined) as AggregateEvent[];

    const accountEvents = groupEvents(events, AccountAggregateName);
    const accountUserEvents = groupEvents(events, AccountUserAggregateName);
    const spendingEvents = groupEvents(events, SpendingAggregateName);
    const spendingEventsByAccount = groupEvents<
        SpendingCreatedEvent | SpendingDeletedEvent
    >(events as SpendingCreatedEvent[], SpendingAggregateName, e =>
        e.eventName === SpendingCreatedEventName
            ? (<SpendingCreatedEvent>e).eventPayload.accountId
            : false,
    );

    await Promise.all([
        processGroupedEvents(
            accountEvents,
            applyAccountEvents,
            findAccountAggregate,
            persistAccount,
            removeAccount,
        ),
        processGroupedEvents(
            accountUserEvents,
            applyAccountUserEvents,
            findAccountUserAggregate,
            persistAccountUser,
            removeAccountUser,
        ),
        processGroupedEvents(
            spendingEvents,
            applySpendingEvents,
            findSpendingAggregate,
            persistSpending,
            removeSpending,
        ),
        processEventsForAutoComplete(
            spendingEventsByAccount,
            findAutoCompleteByAccountId,
            persistAutoComplete,
        ),
    ]);
};
