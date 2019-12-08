import { Aggregate } from '../eventsourcing/aggregateRepository/Aggregate'
import { Currency } from '../currency/currencies'

export const AccountAggregateName = 'Account'

export type Account = Aggregate & {
	name: string
	isSavingsAccount: boolean
	defaultCurrency: Currency
}
