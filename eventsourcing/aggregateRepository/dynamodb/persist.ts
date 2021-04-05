import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import * as AggregateRepository from '../persist'
import { Aggregate } from '../Aggregate'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { ConflictError } from '../../../errors/ConflictError'
import { getOrElseL } from '../../../fp-compat/getOrElseL'
import {
	DynamoDBItem,
	DynamoDBItemWithRemovableProperties,
} from './DynamoDBItem'

const reservedItemKeys = [
	'aggregateId',
	'version',
	'createdAt',
	'updatedAt',
	'deletedAt',
	'nextversion',
]

export const persist = <A extends Aggregate>(
	dynamodb: DynamoDBClient,
	TableName: string,
	aggregateToItem: (aggregate: A) => DynamoDBItemWithRemovableProperties,
): AggregateRepository.persist<A> => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))((errors) => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'aggregateRepository/dynamodb/persist()',
			errors,
		)
	})
	return async (aggregate: A): Promise<void> => {
		const Item = aggregateToItem(aggregate)
		const itemKeys = Object.keys(Item)
		itemKeys.forEach((key) => {
			if (reservedItemKeys.includes(key)) {
				// FIXME: Replace with Either
				throw new TypeError(
					`aggregateRepository/dynamodb/persist(): Frozen item must not have key of ${reservedItemKeys.join(
						',',
					)}!`,
				)
			}
		})

		const updateFields = [
			...Object.entries(Item)
				.filter(([, v]) => !('remove' in v))
				.map(([k]) => k),
			'version',
			'createdAt',
		]

		const removeFields = Object.entries(Item)
			.filter(([, v]) => 'remove' in v)
			.map(([k]) => k)

		const values: DynamoDBItem = {
			...Object.keys(Item).reduce((o, k) => {
				if (!('remove' in Item[k])) {
					o[`:${k}`] = Item[k]
				}
				return o
			}, {} as DynamoDBItem),
			':version': {
				N: `${aggregate._meta.version}`,
			},
			':createdAt': {
				S: aggregate._meta.createdAt.toISOString(),
			},
		}
		if (aggregate._meta.updatedAt !== undefined) {
			updateFields.push('updatedAt')
			values[':updatedAt'] = {
				S: aggregate._meta.updatedAt.toISOString(),
			}
		}
		if (aggregate._meta.deletedAt !== undefined) {
			updateFields.push('deletedAt')
			values[':deletedAt'] = {
				S: aggregate._meta.deletedAt.toISOString(),
			}
		}
		let ConditionExpression
		if (aggregate._meta.version === 1) {
			ConditionExpression = 'attribute_not_exists(aggregateId)'
		} else {
			ConditionExpression = '#version < :nextversion'
			values[':nextversion'] = {
				N: `${aggregate._meta.version}`,
			}
		}

		let UpdateExpression = `SET ${updateFields
			.map((f) => `#${f} = :${f}`)
			.join(', ')}`

		// Remove properties
		const removeProperties = Object.entries(Item)
			.filter(([, v]) => 'remove' in v)
			.map(([k]) => k)
		if (removeProperties.length > 0) {
			UpdateExpression = `${UpdateExpression} REMOVE ${removeProperties
				.map((f) => `#${f}`)
				.join(', ')}`
		}

		const updateArgs = {
			TableName,
			Key: {
				aggregateId: {
					S: aggregate._meta.id,
				},
			},
			UpdateExpression,
			ExpressionAttributeNames: [...updateFields, ...removeFields].reduce(
				(map, f) => ({
					...map,
					[`#${f}`]: f,
				}),
				{} as {
					[key: string]: string
				},
			),
			ExpressionAttributeValues: values,
			ConditionExpression,
		}

		console.debug(JSON.stringify(updateArgs))

		try {
			await dynamodb.send(new UpdateItemCommand(updateArgs))
		} catch (error) {
			if (error.name === 'ConditionalCheckFailedException') {
				// FIXME: Replace with Either
				throw new ConflictError(
					`Failed to persist "${aggregate._meta.id}"!`,
				)
			}
			// FIXME: Replace with Either
			throw error
		}
	}
}
