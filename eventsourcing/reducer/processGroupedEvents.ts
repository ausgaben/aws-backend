import { AggregateEvent, AggregateEventWithPayload } from '../AggregateEvent';
import { findByUUID } from '../aggregateRepository/findByUUID';
import {
    AggregatePresentation,
    AggregatePresentationStates,
    AggregateSnapshot,
    CreateAggregatePresentation,
    DeleteAggregatePresentation,
    Snapshot,
} from '../presenter/presentation';
import { Aggregate } from '../aggregateRepository/Aggregate';
import { persist } from '../aggregateRepository/persist';
import { remove } from '../aggregateRepository/remove';

type AggregateEvents = {
    [key: string]: (AggregateEvent | AggregateEventWithPayload)[];
};

/**
 * Process the grouped events for an aggregate
 */
export const processGroupedEvents = async <A extends Aggregate>(
    events: AggregateEvents,
    applyEvents: (
        snapshot: AggregateSnapshot<A>,
        events: (AggregateEvent | AggregateEventWithPayload)[],
    ) => AggregatePresentation,
    findAggregate: findByUUID<A>,
    persist: persist<A>,
    remove: remove<A>,
): Promise<void> => {
    await Promise.all(
        Object.keys(events).map(async aggregateUUID => {
            try {
                // Load the snapshot of the aggregate
                const aggregate = await findAggregate(aggregateUUID);
                // Apply the events to the snapshot
                const presentation = applyEvents(
                    Snapshot<A>(aggregateUUID, aggregate),
                    events[aggregateUUID],
                );
                // Persist the changes
                switch (presentation.type) {
                    case AggregatePresentationStates.Create:
                        await persist(
                            (<CreateAggregatePresentation<A>>presentation)
                                .aggregate,
                        );
                        break;
                    case AggregatePresentationStates.Delete:
                        await remove(
                            (<DeleteAggregatePresentation<A>>presentation)
                                .aggregate,
                        );
                }
            } catch (error) {
                console.error('Processing grouped events failed!');
                console.error(
                    JSON.stringify({
                        events,
                        error,
                    }),
                );
            }
        }),
    );
};
