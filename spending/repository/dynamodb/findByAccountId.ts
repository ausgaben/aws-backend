import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import * as SpendingRepository from '../findByAccountId'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { PaginatedResult } from '../../../eventsourcing/aggregateRepository/PaginatedResult'
import { Spending, SpendingAggregateName } from '../../Spending'
import { batchFetch } from '../../../eventsourcing/aggregateRepository/dynamodb/batchFetch'
import { itemToAggregate } from './itemToAggregate'
import { UUIDv4 } from '../../../validation/UUIDv4'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

export const findByAccountId = (
	dynamodb: DynamoDBClient,
	TableName: string,
): SpendingRepository.findByAccountId => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))((errors) => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'spending/repository/dynamodb/findByAccountId()',
			errors,
		)
	})
	return async (args: {
		startDate: Date
		endDate: Date
		accountId: string
		startKey?: any
	}): Promise<PaginatedResult<Spending>> => {
		const accountId = getOrElseL(UUIDv4.decode(args.accountId))(
			(errors) => {
				// FIXME: Replace with Either
				throw new ValidationFailedError(
					'spending/repository/dynamodb/findByAccountId()',
					errors,
				)
			},
		)

		const { Items, LastEvaluatedKey } = await dynamodb.send(
			new QueryCommand({
				TableName,
				IndexName: 'accountIdIndex',
				KeyConditionExpression: `accountId = :accountId AND bookedAt BETWEEN :startDate AND :endDate`,
				ExpressionAttributeValues: {
					[`:accountId`]: {
						S: accountId,
					},
					[`:startDate`]: {
						S: args.startDate.toISOString(),
					},
					[`:endDate`]: {
						S: args.endDate.toISOString(),
					},
				},
				ExclusiveStartKey: args.startKey,
				ScanIndexForward: false,
				ProjectionExpression: 'aggregateId',
				Limit: 100,
			}),
		)
		return batchFetch(
			dynamodb,
			TableName,
			SpendingAggregateName,
			[
				'accountId',
				'bookedAt',
				'booked',
				'category',
				'description',
				'amount',
				'currencyId',
			],
			itemToAggregate,
			Items,
			LastEvaluatedKey,
		)
	}
}
