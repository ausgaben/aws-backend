import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'

export const AccountCreatedEventName = 'AccountCreated'

export type AccountCreatedEvent = AggregateEventWithPayload<{
	name: string
	isSavingsAccount: boolean
	defaultCurrencyId?: string // added in version 2
}>
