import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb-v2-node'
import * as ExchangeRatesRepository from '../findByDate'
import { NonEmptyString } from '../../../validation/NonEmptyString'
import { ValidationFailedError } from '../../../errors/ValidationFailedError'
import { getOrElseL } from '../../../fp-compat/getOrElseL'
import { Currency } from '../../../currency/currencies'
import { Option, none, some } from 'fp-ts/lib/Option'

export const findByDate = (
	dynamodb: DynamoDBClient,
	TableName: string,
): ExchangeRatesRepository.findByDate => {
	TableName = getOrElseL(NonEmptyString.decode(TableName))(errors => {
		throw new ValidationFailedError(
			'exchangeRates/repository/dynamodb/findByDate()',
			errors,
		)
	})
	return async ({
		currency,
		date,
	}: {
		currency: Currency
		date: Date
	}): Promise<Option<ExchangeRatesRepository.ExchangeRate>> => {
		const { Items } = await dynamodb.send(
			new QueryCommand({
				TableName,
				KeyConditionExpression:
					'#currencyId = :currencyId AND #date <= :date',
				ExpressionAttributeValues: {
					[`:currencyId`]: {
						S: currency.id,
					},
					[`:date`]: {
						S: date.toISOString().substring(0, 10),
					},
				},
				ExpressionAttributeNames: {
					'#date': 'date',
					'#rate': 'rate',
					'#currencyId': 'currencyId',
				},
				Limit: 1,
				ProjectionExpression: '#date,#rate',
				ScanIndexForward: false,
			}),
		)
		if (!Items) {
			return none
		}
		return some({
			currency,
			date: new Date(Items[0].date.S as string),
			rate: parseFloat(Items[0].rate.N as string),
		})
	}
}
