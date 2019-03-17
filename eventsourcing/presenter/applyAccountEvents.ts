import { AggregateEvent } from '../AggregateEvent';
import { Account, AccountAggregateName } from '../../account/Account';
import {
    AggregatePresentation,
    AggregateSnapshot,
    Create,
} from './presentation';
import {
    AccountCreatedEvent,
    AccountCreatedEventName,
} from '../../events/AccountCreated';

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
                        $meta: {
                            name: AccountAggregateName,
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
