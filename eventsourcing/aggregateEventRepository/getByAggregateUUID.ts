import { PersistedEvent } from './PersistedEvent';

/**
 * Returns the events for the given UUID.
 */
export type getByAggregateUUID = (
    aggregateUUID: string,
) => Promise<PersistedEvent[]>;
