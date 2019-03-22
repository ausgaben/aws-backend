import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist';
import { GQLError } from '../GQLError';
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId';
import { getByUUID } from '../../eventsourcing/aggregateRepository/dynamodb/getByUUID';
import { AccountAggregateName } from '../../account/Account';
import { itemToAggregate as accountItemToAggregate } from '../../account/repository/dynamodb/itemToAggregate';
import { itemToAggregate as accountUserItemToAggregate } from '../../accountUser/repository/dynamodb/itemToAggregate';
import { deleteAccount } from '../../commands/deleteAccount';
import { deleteAccountUser } from '../../commands/deleteAccountUser';
import { AccountUserAggregateName } from '../../accountUser/AccountUser';

const db = new DynamoDBClient({});
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE!;
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE!;
const accountsTableName = process.env.ACCOUNTS_TABLE!;

const findAccountUserByUserId = findByUserId(db, accountUsersTableName);
const getAccountByUUID = getByUUID(
    db,
    accountsTableName,
    AccountAggregateName,
    accountItemToAggregate,
);
const getAccountUserByUUID = getByUUID(
    db,
    accountUsersTableName,
    AccountUserAggregateName,
    accountUserItemToAggregate,
);
const persist = persistDynamoDB(db, aggregateEventsTableName);

const removeAccountUser = deleteAccountUser(persist, getAccountUserByUUID);
const remove = deleteAccount(
    persist,
    getAccountByUUID,
    findAccountUserByUserId,
    async args =>
        removeAccountUser({ accountUserId: args.accountUser._meta.uuid }),
);

export const handler = async (
    event: {
        cognitoIdentityId: string;
        uuid: string;
    },
    context: Context,
) => {
    try {
        await remove({
            accountId: event.uuid,
            userId: event.cognitoIdentityId,
        });
    } catch (error) {
        return GQLError(context, error);
    }
};
