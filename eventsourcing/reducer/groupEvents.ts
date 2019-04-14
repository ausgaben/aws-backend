import { AggregateEvent, AggregateEventWithPayload } from '../AggregateEvent';

/**
 * Get the events grouped by aggregateId for the given aggregate
 */
export const groupEvents = <
    E extends AggregateEvent | AggregateEventWithPayload
>(
    events: E[],
    aggregateName: string,
    getGroupKey: (e: E) => string | false = e => e.aggregateId,
): { [key: string]: E[] } =>
    events
        .filter(({ aggregateName: a }) => a === aggregateName)
        .reduce(
            (grouped, event) => {
                const k = getGroupKey(event);
                if (!k) {
                    return grouped;
                }
                if (!grouped[k]) {
                    grouped[k] = [];
                }
                grouped[k].push(event);
                return grouped;
            },
            {} as {
                [key: string]: E[];
            },
        );
