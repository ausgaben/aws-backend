import { Currency } from '../../currency/currencies'
import { Option } from 'fp-ts/lib/Option'

export type ExchangeRate = {
	currency: Currency
	rate: number
	date: Date
}
export type findByDate = (args: {
	currency: Currency
	date: Date
}) => Promise<Option<ExchangeRate>>
