import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import * as AccountUserRepository from '../findByUserId'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { PaginatedResult } from '../../../eventsourcing/aggregateRepository/PaginatedResult'
import { AccountUser, AccountUserAggregateName } from '../../AccountUser'
import { CognitoUserId } from '../../../validation/CognitoUserId'
import { batchFetch } from '../../../eventsourcing/aggregateRepository/dynamodb/batchFetch'
import { itemToAggregate } from './itemToAggregate'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

export const findByUserId = (
	dynamodb: DynamoDBClient,
	TableName: string,
): AccountUserRepository.findByUserId => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))((errors) => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'accountUser/repository/dynamodb/findByUserId()',
			errors,
		)
	})
	return async (
		userId: string,
		startKey?: any,
	): Promise<PaginatedResult<AccountUser>> => {
		userId = getOrElseL(CognitoUserId.decode(userId))((errors) => {
			// FIXME: Replace with Either
			throw new ValidationFailedError(
				'accountUser/repository/dynamodb/findByUserId()',
				errors,
			)
		})

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
		)
		return batchFetch(
			dynamodb,
			TableName,
			AccountUserAggregateName,
			['accountId', 'userId'],
			itemToAggregate,
			Items,
			LastEvaluatedKey,
		)
	}
}
