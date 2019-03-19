import { ValidationFailedError } from '../errors/ValidationFailedError';
import {
    AccountCreatedEvent,
    AccountCreatedEventName,
    AccountCreatedEventPayload,
} from '../events/AccountCreated';
import { AccountAggregateName } from '../account/Account';
import { v4 } from 'uuid';
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent';
import {
    AccountUserCreatedEvent,
    AccountUserCreatedEventName,
    AccountUserCreatedEventPayload,
} from '../events/AccountUserCreated';
import { AccountUserAggregateName } from '../accountUser/AccountUser';

export const createAccount = async (
    persist: (ev: AggregateEventWithPayload) => Promise<void>,
    userId: string,
    name: string,
    isSavingsAccount: boolean = false,
): Promise<void> => {
    AccountCreatedEventPayload.decode({
        name,
        isSavingsAccount,
    }).mapLeft(errors => {
        throw new ValidationFailedError('createAccount()', errors);
    });
    const accountId = v4();

    AccountUserCreatedEventPayload.decode({
        accountId,
        userId,
    }).mapLeft(errors => {
        throw new ValidationFailedError('createAccount()', errors);
    });

    const createAccountEvent: AccountCreatedEvent = {
        eventUUID: v4(),
        eventName: AccountCreatedEventName,
        aggregateName: AccountAggregateName,
        aggregateUUID: accountId,
        eventCreatedAt: new Date(),
        eventPayload: {
            name,
            isSavingsAccount,
        },
    };
    const createAccountUserEvent: AccountUserCreatedEvent = {
        eventUUID: v4(),
        eventName: AccountUserCreatedEventName,
        aggregateName: AccountUserAggregateName,
        aggregateUUID: v4(),
        eventCreatedAt: new Date(),
        eventPayload: {
            accountId,
            userId,
        },
    };
    await Promise.all([
        persist(createAccountEvent),
        persist(createAccountUserEvent),
    ]);
};
