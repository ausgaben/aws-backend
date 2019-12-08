import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'

export const AccountUserCreatedEventName = 'AccountUserCreated'

export type AccountUserCreatedEvent = AggregateEventWithPayload<{
	accountId: string
	userId: string
}>
