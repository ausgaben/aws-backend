import { Aggregate } from '../eventsourcing/aggregateRepository/Aggregate'

export const SpendingAggregateName = 'Spending'

export type Spending = Aggregate & {
	accountId: string
	bookedAt: Date
	category: string
	description: string
	amount: number
	currencyId: string
	booked: boolean
	// If set:
	// - this marks the spending as a "saving"
	// - the "saving" is assigned to the account referenced in the id
	// - in that account, the spending should be included the in the list of incomes (and have a positive amount)
	transferToAccountId?: string
}
