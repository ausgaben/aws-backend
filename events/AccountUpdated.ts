import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'

export const AccountUpdatedEventName = 'AccountUpdated'

export type Change<T> = {
	set: T
}

export type Delete = {
	delete: true
}

export type AccountUpdatedEvent = AggregateEventWithPayload<{
	defaultCurrencyId?: Change<string>
}>
