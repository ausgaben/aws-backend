import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node'
import { GQLError } from '../GQLError'
import { findByDate } from '../../exchangeRates/repository/dynamodb/findByDate'
import { findCurrencyById } from '../../currency/currencies'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { isNone } from 'fp-ts/lib/Option'

const db = new DynamoDBClient({})
const exchangeRatesTable = process.env.EXCHANGE_RATES_TABLE as string

const findexchangeRateByDate = findByDate(db, exchangeRatesTable)

export const handler = async (
	{
		currencyId,
		date,
	}: {
		currencyId: string
		date: string
	},
	context: Context,
) => {
	const currency = findCurrencyById(currencyId)
	if (!currency)
		return GQLError(
			context,
			new EntityNotFoundError(`Unknown currency: ${currencyId}!`),
		)
	const res = await findexchangeRateByDate({
		currency,
		date: new Date(date),
	})
	if (isNone(res)) {
		return GQLError(
			context,
			new EntityNotFoundError(
				`No exchange rate found for: ${currencyId} ${date}!`,
			),
		)
	}
	const { rate, date: rateDate } = res.value
	return {
		currency,
		rate,
		date: rateDate.toISOString(),
	}
}
