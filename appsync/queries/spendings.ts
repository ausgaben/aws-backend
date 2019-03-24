import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { GQLError } from '../GQLError';
import { findByAccountId } from '../../spending/repository/dynamodb/findByAccountId';
import { canAccessAccount } from '../../accountUser/canAccessAccount';
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId';
import { currencies } from '../../currency/currencies';

const db = new DynamoDBClient({});
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE!;
const spendingsTable = process.env.SPENDINGS_TABLE!;

const findAccountUserByUserId = findByUserId(db, accountUsersTableName);
const findSpendingsByAccountId = findByAccountId(db, spendingsTable);

const checkAccess = canAccessAccount(findAccountUserByUserId);

export const handler = async (
    event: {
        cognitoIdentityId: string;
        accountId: string;
        filter?: {};
        startKey?: string;
    },
    context: Context,
) => {
    try {
        checkAccess({
            userId: event.cognitoIdentityId,
            accountId: event.accountId,
        });
        const { items, nextStartKey } = await findSpendingsByAccountId(
            event.accountId,
        );
        return {
            items: items.map(item => ({
                ...item,
                bookedAt: item.bookedAt.toISOString(),
                currency: currencies.find(({ id }) => item.currencyId === id),
            })),
            nextStartKey,
        };
    } catch (error) {
        return GQLError(context, error);
    }
};
