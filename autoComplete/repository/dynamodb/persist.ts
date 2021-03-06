import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import * as AccountAutoCompleteRepository from '../persist'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { UUIDv4 } from '../../../validation/UUIDv4'
import * as t from 'io-ts'
import { getOrElseL } from '../../../fp-compat/getOrElseL'

export const persist = (
	dynamodb: DynamoDBClient,
	TableName: string,
): AccountAutoCompleteRepository.persist => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))((errors) => {
		// FIXME: Replace with Either
		throw new ValidationFailedError(
			'autoComplete/repository/dynamodb/persist()',
			errors,
		)
	})
	return async (args: {
		accountId: string
		autoCompleteStrings: { [key: string]: string[] }
	}): Promise<void> => {
		const { accountId, autoCompleteStrings } = getOrElseL(
			t
				.type({
					accountId: UUIDv4,
					autoCompleteStrings: t.record(
						t.string,
						t.array(NonEmptyString),
					),
				})
				.decode(args),
		)((errors) => {
			// FIXME: Replace with Either
			throw new ValidationFailedError(
				'autoComplete/repository/dynamodb/persist()',
				errors,
			)
		})

		await Promise.all(
			Object.keys(autoCompleteStrings).map(async (field) =>
				dynamodb.send(
					new PutItemCommand({
						TableName,
						Item: {
							accountId: {
								S: accountId,
							},
							autoCompleteField: {
								S: field,
							},
							autoCompleteValues:
								autoCompleteStrings[field].length === 0
									? { NULL: true }
									: { SS: autoCompleteStrings[field] },
						},
					}),
				),
			),
		)
	}
}
