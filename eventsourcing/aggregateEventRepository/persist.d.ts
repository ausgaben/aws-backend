import { AggregateEvent, AggregateEventWithPayload } from '../AggregateEvent'

/**
 * Persists the event. This will append the event the the list of events for the Aggregate.
 */
export type persist = (
	event: AggregateEvent | AggregateEventWithPayload,
) => Promise<void>
