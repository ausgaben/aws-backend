import { Aggregate } from '../eventsourcing/aggregateRepository/Aggregate'

export const AccountAggregateName = 'Account'

export type Account = Aggregate & {
	name: string
	isSavingsAccount: boolean
}
