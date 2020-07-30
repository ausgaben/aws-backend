import {
	DynamoDBClient,
	DeleteItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node'
import * as AggregateRepository from '../remove'
import { Aggregate } from '../Aggregate'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

export const remove = <A extends Aggregate>(
	dynamodb: DynamoDBClient,
	TableName: string,
): AggregateRepository.remove<A> => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))((errors) => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'aggregateRepository/dynamodb/removeD()',
			errors,
		)
	})
	return async (aggregate: A): Promise<void> => {
		await dynamodb.send(
			new DeleteItemCommand({
				TableName,
				Key: {
					aggregateId: {
						S: aggregate._meta.id,
					},
				},
			}),
		)
	}
}
