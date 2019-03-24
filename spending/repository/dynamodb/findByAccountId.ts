import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb-v2-node';
import * as SpendingRepository from '../findByAccountId';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { PaginatedResult } from '../../../eventsourcing/aggregateRepository/PaginatedResult';
import { Spending, SpendingAggregateName } from '../../Spending';
import { batchFetch } from '../../../eventsourcing/aggregateRepository/dynamodb/batchFetch';
import { itemToAggregate } from './itemToAggregate';
import { UUIDv4 } from '../../../validation/UUIDv4';

export const findByAccountId = (
    dynamodb: DynamoDBClient,
    TableName: string,
): SpendingRepository.findByAccountId => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'spending/repository/dynamodb/findByAccountId()',
            errors,
        );
    });
    return async (
        accountId: string,
        startKey?: any,
    ): Promise<PaginatedResult<Spending>> => {
        accountId = UUIDv4.decode(accountId).getOrElseL(errors => {
            throw new ValidationFailedError(
                'spending/repository/dynamodb/findByAccountId()',
                errors,
            );
        });

        const { Items, LastEvaluatedKey } = await dynamodb.send(
            new QueryCommand({
                TableName,
                IndexName: 'accountIdIndex',
                KeyConditionExpression: `accountId = :accountId`,
                ExpressionAttributeValues: {
                    [`:accountId`]: {
                        S: accountId,
                    },
                },
                ExclusiveStartKey: startKey,
                ScanIndexForward: false,
            }),
        );
        return batchFetch(
            dynamodb,
            TableName,
            SpendingAggregateName,
            [
                'accountId',
                'bookedAt',
                'category',
                'description',
                'amount',
                'currencyId',
                'isIncome',
                'isPending',
                'paidWith',
            ],
            itemToAggregate,
            Items,
            LastEvaluatedKey,
        );
    };
};
