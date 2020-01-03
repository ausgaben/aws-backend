import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb-v2-node'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { UUIDv4 } from '../../../validation/UUIDv4'
import { PersistedEvent } from '../PersistedEvent'
import * as AggregateEventRepository from '../getByAggregateId'
import { DynamoDBItem } from '../../aggregateRepository/dynamodb/DynamoDBItem'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

const fetchEvents = async (
	dynamodb: DynamoDBClient,
	TableName: string,
	aggregateId: string,
	events: DynamoDBItem[] = [],
	ExclusiveStartKey?: DynamoDBItem,
): Promise<DynamoDBItem[]> => {
	const { Items, LastEvaluatedKey } = await dynamodb.send(
		new QueryCommand({
			TableName,
			ExclusiveStartKey,
			KeyConditionExpression:
				'aggregateId = :aggregateId AND insertedAtNanotime > :insertedAtNanotime',
			ExpressionAttributeValues: {
				':aggregateId': { S: aggregateId },
				':insertedAtNanotime': { N: '0' },
			},
		}),
	)
	if (Items) {
		events = events.concat(Items)
	}
	if (LastEvaluatedKey) {
		return fetchEvents(
			dynamodb,
			TableName,
			aggregateId,
			events,
			LastEvaluatedKey,
		)
	}
	return events
}

export const getByAggregateId = (
	dynamodb: DynamoDBClient,
	TableName: string,
): AggregateEventRepository.getByAggregateId => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))(errors => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'aggregateEventRepository/dynamodb/getByAggregateId()',
			errors,
		)
	})
	return async (aggregateId: string): Promise<PersistedEvent[]> => {
		aggregateId = getOrElseL(UUIDv4.decode(aggregateId))(errors => {
			// FIXME: Replace with Either
			throw new ValidationFailedError(
				'aggregateEventRepository/dynamodb/getByAggregateId()',
				errors,
			)
		})

		const events = await fetchEvents(dynamodb, TableName, aggregateId)

		return events.map(event => ({
			eventId: event.eventId.S as string,
			eventName: event.eventName.S as string,
			eventCreatedAt: new Date(event.eventCreatedAt.S as string),
			insertedAtNanotime: event.insertedAtNanotime.N as string,
			aggregateName: event.aggregateName.S as string,
			aggregateId: event.aggregateId.S as string,
			eventPayload: event.eventPayload
				? JSON.parse(event.eventPayload.S as string)
				: undefined,
		}))
	}
}
