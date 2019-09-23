import * as t from 'io-ts';
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent';
import {
    AccountUserCreatedEvent,
    AccountUserCreatedEventName,
} from '../events/AccountUserCreated';
import { CognitoUserId } from '../validation/CognitoUserId';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { v4 } from 'uuid';
import { UUIDv4 } from '../validation/UUIDv4';
import { AccountUserAggregateName } from '../accountUser/AccountUser';
import { getOrElseL } from '../fp-compat/getOrElseL';

export const createAccountUser = (
    persist: (ev: AggregateEventWithPayload) => Promise<void>,
) => async (args: {
    userId: string;
    accountId: string;
}): Promise<AccountUserCreatedEvent> => {
    const eventPayload = getOrElseL(
        t
            .type({
                accountId: UUIDv4,
                userId: CognitoUserId,
            })
            .decode(args),
    )(errors => {
        throw new ValidationFailedError('createAccountUser()', errors);
    });
    const e: AccountUserCreatedEvent = {
        eventId: v4(),
        eventName: AccountUserCreatedEventName,
        aggregateName: AccountUserAggregateName,
        aggregateId: v4(),
        eventCreatedAt: new Date(),
        eventPayload,
    };
    await persist(e);
    return e;
};
