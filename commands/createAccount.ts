import * as t from 'io-ts';
import {
    AccountCreatedEvent,
    AccountCreatedEventName,
} from '../events/AccountCreated';
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent';
import { CognitoUserId } from '../validation/CognitoUserId';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { NonEmptyString } from '../validation/NonEmptyString';
import { v4 } from 'uuid';
import { AccountAggregateName } from '../account/Account';

export const createAccount = (
    persist: (ev: AggregateEventWithPayload) => Promise<void>,
) => async (args: {
    name: string;
    isSavingsAccount: boolean;
    userId: string;
}): Promise<AccountCreatedEvent> => {
    const { name, isSavingsAccount } = t
        .type({
            name: NonEmptyString,
            userId: CognitoUserId,
            isSavingsAccount: t.boolean,
        })
        .decode(args)
        .getOrElseL(errors => {
            throw new ValidationFailedError('createAccount()', errors);
        });
    const e: AccountCreatedEvent = {
        eventUUID: v4(),
        eventName: AccountCreatedEventName,
        aggregateName: AccountAggregateName,
        aggregateUUID: v4(),
        eventCreatedAt: new Date(),
        eventPayload: {
            name,
            isSavingsAccount,
        },
    };
    await persist(e);
    return e;
};
