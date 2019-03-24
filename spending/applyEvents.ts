import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import { Spending, SpendingAggregateName } from './Spending';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
    Delete,
} from '../eventsourcing/presenter/presentation';
import {
    SpendingCreatedEvent,
    SpendingCreatedEventName,
} from '../events/SpendingCreated';
import { SpendingDeletedEventName } from '../events/SpendingDeleted';

export const applyEvents = (
    snapshot: AggregateSnapshot<Spending>,
    events: AggregateEvent[],
): AggregatePresentation =>
    events.reduce(
        (presentation, event) => {
            switch (event.eventName) {
                case SpendingCreatedEventName:
                    const payload = (<SpendingCreatedEvent>event).eventPayload;
                    return Create<Spending>({
                        ...payload,
                        bookedAt: new Date(payload.bookedAt),
                        _meta: {
                            name: SpendingAggregateName,
                            id: snapshot.aggregateId,
                            version: 1,
                            createdAt: event.eventCreatedAt,
                        },
                    });
                case SpendingDeletedEventName:
                    const aggregate = (<AggregateSnapshot<Spending>>(
                        presentation
                    )).aggregate!;
                    return Delete({
                        ...aggregate,
                        _meta: {
                            ...aggregate._meta,
                            version: aggregate._meta.version + 1,
                            deletedAt: event.eventCreatedAt,
                        },
                    });
                default:
                    return presentation;
            }
        },
        snapshot as AggregatePresentation,
    );
