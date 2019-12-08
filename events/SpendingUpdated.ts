import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'

export const SpendingUpdatedEventName = 'SpendingUpdated'

export type Change<T> = {
	set: T
}

export type Delete = {
	delete: true
}

export type SpendingUpdatedEvent = AggregateEventWithPayload<{
	booked?: Change<boolean>
}>
