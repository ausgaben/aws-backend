import {
	DynamoDBClient,
	UpdateItemCommand,
	AttributeValue,
} from '@aws-sdk/client-dynamodb'
import * as AggregateRepository from '../persist'
import { Aggregate } from '../Aggregate'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { ConflictError } from '../../../errors/ConflictError'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

type DynamoDBItem = {
	[key: string]: AttributeValue
}

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
	aggregateToItem: (aggregate: A) => DynamoDBItem,
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
		const fields: string[] = [
			...itemKeys.map((key) => `#${key}`),
			'#version',
			'#createdAt',
		]

		const values: DynamoDBItem = {
			...Object.keys(Item).reduce((o, k) => {
				o[`:${k}`] = Item[k]
				return o
			}, {} as DynamoDBItem),
			':version': {
				N: `${aggregate._meta.version}`,
			},
			':createdAt': {
				S: aggregate._meta.createdAt.toISOString(),
			},
		}
		if (aggregate._meta.updatedAt) {
			fields.push('#updatedAt')
			values[':updatedAt'] =
				aggregate._meta.updatedAt !== undefined
					? {
							S: aggregate._meta.updatedAt.toISOString(),
					  }
					: { NULL: true }
		}
		if (aggregate._meta.deletedAt) {
			fields.push('#deletedAt')
			values[':deletedAt'] =
				aggregate._meta.deletedAt !== undefined
					? {
							S: aggregate._meta.deletedAt.toISOString(),
					  }
					: { NULL: true }
		}
		let ConditionExpression
		if (aggregate._meta.version === 1) {
			ConditionExpression = 'attribute_not_exists(aggregateId)'
		} else {
			ConditionExpression = 'version < :nextversion'
			values[':nextversion'] = {
				N: `${aggregate._meta.version}`,
			}
		}

		try {
			await dynamodb.send(
				new UpdateItemCommand({
					TableName,
					Key: {
						aggregateId: {
							S: aggregate._meta.id,
						},
					},
					UpdateExpression: `SET ${fields
						.map((f) => `${f} = :${f.substr(1)}`)
						.join(',')}`,
					ExpressionAttributeNames: fields.reduce(
						(map, key) => {
							map[key] = key.substr(1)
							return map
						},
						{} as {
							[key: string]: string
						},
					),
					ExpressionAttributeValues: values,
					ConditionExpression,
				}),
			)
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
