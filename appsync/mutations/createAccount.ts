import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist';
import { createAccount } from '../../commands/createAccount';
import { GQLError } from '../GQLError';
import { createAccountUser } from '../../commands/createAccountUser';

const db = new DynamoDBClient({});
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE!;

const persist = persistDynamoDB(db, aggregateEventsTableName);
const create = createAccount(persist);
const addUserToAccount = createAccountUser(persist);

export const handler = async (
    event: {
        cognitoIdentityId: string;
        name: string;
        isSavingsAccount?: boolean;
    },
    context: Context,
) => {
    try {
        const e = await create({
            name: event.name,
            isSavingsAccount: !!event.isSavingsAccount,
            userId: event.cognitoIdentityId,
        });
        await addUserToAccount({
            userId: event.cognitoIdentityId,
            accountId: e.aggregateUUID,
        });
        return {
            uuid: e.aggregateUUID,
        };
    } catch (error) {
        return GQLError(context, error);
    }
};
