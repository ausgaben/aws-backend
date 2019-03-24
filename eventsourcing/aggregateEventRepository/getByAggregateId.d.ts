import { PersistedEvent } from './PersistedEvent';

/**
 * Returns the events for the given id.
 */
export type getByAggregateId = (
    aggregateId: string,
) => Promise<PersistedEvent[]>;
