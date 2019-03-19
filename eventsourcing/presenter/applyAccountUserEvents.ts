import { AggregateEvent } from '../AggregateEvent';
import {
    AccountUser,
    AccountUserAggregateName,
} from '../../accountUser/AccountUser';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
} from './presentation';
import {
    AccountUserCreatedEvent,
    AccountUserCreatedEventName,
} from '../../events/AccountUserCreated';

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
                default:
                    return presentation;
            }
        },
        snapshot as AggregatePresentation,
    );
