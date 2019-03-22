import { AggregateEvent } from '../AggregateEvent';
import {
    AccountUser,
    AccountUserAggregateName,
} from '../../accountUser/AccountUser';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
    Delete,
} from './presentation';
import {
    AccountUserCreatedEvent,
    AccountUserCreatedEventName,
} from '../../events/AccountUserCreated';
import { AccountUserDeletedEventName } from '../../events/AccountUserDeleted';

export const applyAccountUserEvents = (
    snapshot: AggregateSnapshot<AccountUser>,
    events: AggregateEvent[],
): AggregatePresentation =>
    events.reduce(
        (presentation, event) => {
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
                            uuid: snapshot.aggregateUUID,
                            version: 1,
                            createdAt: event.eventCreatedAt,
                        },
                    });
                case AccountUserDeletedEventName:
                    const aggregate = (<AggregateSnapshot<AccountUser>>(
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
