import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import { Spending, SpendingAggregateName } from './Spending';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
    Delete,
    Update,
} from '../eventsourcing/presenter/presentation';
import {
    SpendingCreatedEvent,
    SpendingCreatedEventName,
} from '../events/SpendingCreated';
import { SpendingDeletedEventName } from '../events/SpendingDeleted';
import {
    SpendingUpdatedEvent,
    SpendingUpdatedEventName,
} from '../events/SpendingUpdated';

export const applyEvents = (
    snapshot: AggregateSnapshot<Spending>,
    events: AggregateEvent[],
): AggregatePresentation =>
    events.reduce(
        (presentation, event) => {
            switch (event.eventName) {
                case SpendingCreatedEventName:
                    const createPayload = (<SpendingCreatedEvent>event)
                        .eventPayload;
                    return Create<Spending>({
                        ...createPayload,
                        bookedAt: new Date(createPayload.bookedAt),
                        _meta: {
                            name: SpendingAggregateName,
                            id: snapshot.aggregateId,
                            version: 1,
                            createdAt: event.eventCreatedAt,
                        },
                    });
                case SpendingUpdatedEventName:
                    const aggregateToUpdate = (<AggregateSnapshot<Spending>>(
                        presentation
                    )).aggregate!;
                    const updatePayload = (<SpendingUpdatedEvent>event)
                        .eventPayload;
                    return Update<Spending>({
                        ...aggregateToUpdate,
                        ...(updatePayload.booked &&
                            'set' in updatePayload.booked && {
                                booked: updatePayload.booked.set,
                            }),
                        _meta: {
                            ...aggregateToUpdate._meta,
                            version: aggregateToUpdate._meta.version + 1,
                            deletedAt: event.eventCreatedAt,
                        },
                    });
                case SpendingDeletedEventName:
                    const aggregateToDelete = (<AggregateSnapshot<Spending>>(
                        presentation
                    )).aggregate!;
                    return Delete<Spending>({
                        ...aggregateToDelete,
                        _meta: {
                            ...aggregateToDelete._meta,
                            version: aggregateToDelete._meta.version + 1,
                            deletedAt: event.eventCreatedAt,
                        },
                    });
                default:
                    return presentation;
            }
        },
        snapshot as AggregatePresentation,
    );
