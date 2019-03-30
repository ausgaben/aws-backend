import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb-v2-node';
import * as AccountUserRepository from '../findByUserId';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { PaginatedResult } from '../../../eventsourcing/aggregateRepository/PaginatedResult';
import { AccountUser, AccountUserAggregateName } from '../../AccountUser';
import { CognitoUserId } from '../../../validation/CognitoUserId';
import { batchFetch } from '../../../eventsourcing/aggregateRepository/dynamodb/batchFetch';
import { itemToAggregate } from './itemToAggregate';

export const findByUserId = (
    dynamodb: DynamoDBClient,
    TableName: string,
): AccountUserRepository.findByUserId => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'accountUser/repository/dynamodb/findByUserId()',
            errors,
        );
    });
    return async (
        userId: string,
        startKey?: any,
    ): Promise<PaginatedResult<AccountUser>> => {
        userId = CognitoUserId.decode(userId).getOrElseL(errors => {
            throw new ValidationFailedError(
                'accountUser/repository/dynamodb/findByUserId()',
                errors,
            );
        });

        const { Items, LastEvaluatedKey } = await dynamodb.send(
            new QueryCommand({
                TableName,
                Limit: 10,
                IndexName: 'userIdIndex',
                KeyConditionExpression: `userId = :userId`,
                ExpressionAttributeValues: {
                    [`:userId`]: {
                        S: userId,
                    },
                },
                ExclusiveStartKey: startKey,
                ProjectionExpression: 'aggregateId',
            }),
        );
        return batchFetch(
            dynamodb,
            TableName,
            AccountUserAggregateName,
            ['accountId', 'userId'],
            itemToAggregate,
            Items,
            LastEvaluatedKey,
        );
    };
};
