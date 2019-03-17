import { ValidationFailedError } from '../errors/ValidationFailedError';
import {
    AccountCreatedEvent,
    AccountCreatedEventName,
    AccountCreatedEventPayload,
} from '../events/AccountCreated';
import { AccountAggregateName } from '../account/Account';
import { v4 } from 'uuid';

export const createAccount = (
    persist: (ev: AccountCreatedEvent) => Promise<void>,
    name: string,
    isSavingsAccount: boolean = false,
): Promise<void> => {
    AccountCreatedEventPayload.decode({
        name,
        isSavingsAccount,
    }).mapLeft(errors => {
        throw new ValidationFailedError('createAccount()', errors);
    });
    const aggregateUUID = v4();
    const eventUUID = v4();
    return persist({
        eventUUID,
        eventName: AccountCreatedEventName,
        aggregateName: AccountAggregateName,
        aggregateUUID,
        eventCreatedAt: new Date(),
        eventPayload: {
            name,
            isSavingsAccount,
        },
    });
};
