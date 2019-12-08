import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'

export const SpendingCreatedEventName = 'SpendingCreated'

export type SpendingCreatedEvent = AggregateEventWithPayload<{
	accountId: string
	bookedAt: Date
	category: string
	description: string
	amount: number
	currencyId: string
	booked: boolean
	paidWith?: string
}>
