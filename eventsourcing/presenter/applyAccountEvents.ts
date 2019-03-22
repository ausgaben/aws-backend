import { AggregateEvent } from '../AggregateEvent';
import { Account, AccountAggregateName } from '../../account/Account';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
    Delete,
} from './presentation';
import {
    AccountCreatedEvent,
    AccountCreatedEventName,
} from '../../events/AccountCreated';
import { AccountDeletedEventName } from '../../events/AccountDeleted';

export const applyAccountEvents = (
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
                            uuid: snapshot.aggregateUUID,
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
