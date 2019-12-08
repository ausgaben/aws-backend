import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import { AccountUser, AccountUserAggregateName } from './AccountUser';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
    Delete,
} from '../eventsourcing/presenter/presentation';
import {
    AccountUserCreatedEvent,
    AccountUserCreatedEventName,
} from '../events/AccountUserCreated';
import { AccountUserDeletedEventName } from '../events/AccountUserDeleted';

export const applyEvents = (
    snapshot: AggregateSnapshot<AccountUser>,
    events: AggregateEvent[],
): AggregatePresentation =>
    events.reduce((presentation, event) => {
        switch (event.eventName) {
            case AccountUserCreatedEventName:
                const { accountId, userId } = (<AccountUserCreatedEvent>(
                    event
                )).eventPayload;
                return Create<AccountUser>({
                    accountId,
                    userId,
                    _meta: {
                        name: AccountUserAggregateName,
                        id: snapshot.aggregateId,
                        version: 1,
                        createdAt: event.eventCreatedAt,
                    },
                });
            case AccountUserDeletedEventName:
                const aggregate = (<AggregateSnapshot<AccountUser>>presentation)
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
    }, snapshot as AggregatePresentation);
