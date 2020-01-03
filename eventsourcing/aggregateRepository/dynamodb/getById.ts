import {
	DynamoDBClient,
	GetItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node'
import * as AggregateRepository from '../getById'
import { Aggregate, AggregateMeta } from '../Aggregate'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { UUIDv4 } from '../../../validation/UUIDv4'
import { EntityNotFoundError } from '../../../errors/EntityNotFoundError'
import { DynamoDBItem } from './DynamoDBItem'
import { toMeta } from './toMeta'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

export const getById = <A extends Aggregate>(
	dynamodb: DynamoDBClient,
	TableName: string,
	aggregateName: string,
	itemToAggregate: (item: DynamoDBItem, _meta: AggregateMeta) => A,
): AggregateRepository.getById<A> => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))(errors => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'aggregateRepository/dynamodb/getById()',
			errors,
		)
	})
	return async (aggregateId: string): Promise<A> => {
		aggregateId = getOrElseL(UUIDv4.decode(aggregateId))(errors => {
			// FIXME: Replace with Either
			throw new ValidationFailedError(
				'aggregateRepository/dynamodb/getById()',
				errors,
			)
		})

		const { Item } = await dynamodb.send(
			new GetItemCommand({
				TableName,
				Key: {
					aggregateId: {
						S: aggregateId,
					},
				},
			}),
		)
		if (!Item) {
			// FIXME: Replace with Either
			throw new EntityNotFoundError(`"${aggregateId}" not found!`)
		}
		return itemToAggregate(Item, toMeta(aggregateName, Item))
	}
}
