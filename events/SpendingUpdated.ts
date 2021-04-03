import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'

export const SpendingUpdatedEventName = 'SpendingUpdated'

export type Change<T> =
	| {
			set: T
	  }
	| { unset: true }

export type SpendingUpdatedEvent = AggregateEventWithPayload<{
	booked?: Change<boolean>
	bookedAt?: Change<Date>
	category?: Change<string>
	description?: Change<string>
	amount?: Change<number>
	currencyId?: Change<string>
	savingForAccountId?: Change<string>
}>
