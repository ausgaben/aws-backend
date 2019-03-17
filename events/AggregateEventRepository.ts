import { AggregateEvent, AggregateEventWithPayload } from './AggregateEvent';

export type PersistedEvent = AggregateEvent & {
    insertedAtNanotime: string;
    eventPayload?: { [key: string]: any };
};

/**
 * Persists the event. This will append the event the the list of events for the Aggregate.
 */
export type persist = (
    event: AggregateEvent | AggregateEventWithPayload,
) => Promise<void>;

/**
 * Returns the events for the given UUID.
 */
export type getByAggregateUUID = (
    aggregateUUID: string,
) => Promise<PersistedEvent[]>;
