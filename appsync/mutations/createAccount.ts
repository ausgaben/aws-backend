import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { persist as persistDynamoDB } from '../../eventsourcing/aggregateEventRepository/dynamodb/persist';
import { createAccount } from '../../commands/createAccount';
import { GQLError } from '../GQLError';

const db = new DynamoDBClient({});
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE!;

const persist = persistDynamoDB(db, aggregateEventsTableName);

export const handler = async (
    event: {
        cognitoIdentityId: string;
        name: string;
        isSavingsAccount?: boolean;
    },
    context: Context,
) => {
    try {
        await createAccount(persist, event.name, event.isSavingsAccount);
        return {
            data: true,
        };
    } catch (error) {
        return GQLError(context, error);
    }
};
