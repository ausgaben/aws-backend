import { AggregateEvent, AggregateEventWithPayload } from '../AggregateEvent';

/**
 * Get the events grouped by aggregateUUID for the given aggregate
 */
export const groupEvents = (
    events: AggregateEvent[] | AggregateEventWithPayload[],
    aggregateName: string,
): { [key: string]: (AggregateEvent | AggregateEventWithPayload)[] } =>
    events
        .filter(({ aggregateName: a }) => a === aggregateName)
        .reduce(
            (grouped, event) => {
                if (!grouped[event.aggregateUUID]) {
                    grouped[event.aggregateUUID] = [];
                }
                grouped[event.aggregateUUID].push(event);
                return grouped;
            },
            {} as {
                [key: string]: (AggregateEvent | AggregateEventWithPayload)[];
            },
        );
