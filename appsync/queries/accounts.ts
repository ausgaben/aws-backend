import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { GQLError } from '../GQLError';
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId';
import { getByUUID } from '../../eventsourcing/aggregateRepository/dynamodb/getByUUID';
import { AccountAggregateName } from '../../account/Account';
import { itemToAggregate } from '../../account/repository/dynamodb/itemToAggregate';

const db = new DynamoDBClient({});
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE!;
const accountsTableName = process.env.ACCOUNTS_TABLE!;

const findAccountUserByUserId = findByUserId(db, accountUsersTableName);
const getAccountByUUID = getByUUID(
    db,
    accountsTableName,
    AccountAggregateName,
    itemToAggregate,
);

export const handler = async (
    event: {
        cognitoIdentityId: string;
        filter?: {
            uuid: string;
        };
        startKey?: string;
    },
    context: Context,
) => {
    try {
        const { items, nextStartKey } = await findAccountUserByUserId(
            event.cognitoIdentityId,
        );
        return {
            items: await Promise.all(
                items
                    .filter(({ accountId }) => {
                        if (!event.filter) {
                            return true;
                        }
                        return event.filter.uuid === accountId;
                    })
                    .map(({ accountId }) => getAccountByUUID(accountId)),
            ),
            nextStartKey,
        };
    } catch (error) {
        return GQLError(context, error);
    }
};