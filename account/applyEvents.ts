import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import { Account, AccountAggregateName } from './Account';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
    Delete,
} from '../eventsourcing/presenter/presentation';
import {
    AccountCreatedEvent,
    AccountCreatedEventName,
} from '../events/AccountCreated';
import { AccountDeletedEventName } from '../events/AccountDeleted';

export const applyEvents = (
    snapshot: AggregateSnapshot<Account>,
    events: AggregateEvent[],
): AggregatePresentation =>
    events.reduce(
        (presentation, event) => {
            switch (event.eventName) {
                case AccountCreatedEventName:
                    const { name, isSavingsAccount } = (<AccountCreatedEvent>(
                        event
                    )).eventPayload;
                    return Create<Account>({
                        name,
                        isSavingsAccount,
                        _meta: {
                            name: AccountAggregateName,
                            id: snapshot.aggregateId,
                            version: 1,
                            createdAt: event.eventCreatedAt,
                        },
                    });
                case AccountDeletedEventName:
                    const aggregate = (<AggregateSnapshot<Account>>presentation)
                        .aggregate!;
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
