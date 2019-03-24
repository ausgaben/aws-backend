import * as t from 'io-ts';
import {
    AccountUserDeletedEvent,
    AccountUserDeletedEventName,
} from '../events/AccountUserDeleted';
import {
    AccountUser,
    AccountUserAggregateName,
} from '../accountUser/AccountUser';
import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getById';
import { UUIDv4 } from '../validation/UUIDv4';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { v4 } from 'uuid';

export const deleteAccountUser = (
    persist: (ev: AggregateEvent) => Promise<void>,
    getAccountUserById: AggregateRepository.getById<AccountUser>,
    onDelete?: (args: { accountUser: AccountUser }) => Promise<void>,
) => async (args: {
    accountUserId: string;
}): Promise<AccountUserDeletedEvent> => {
    const { accountUserId } = t
        .type({
            accountUserId: UUIDv4,
        })
        .decode(args)
        .getOrElseL(errors => {
            throw new ValidationFailedError('deleteAccountUser()', errors);
        });

    const accountUser = await getAccountUserById(accountUserId);

    const deleteAccountUserEvent: AccountUserDeletedEvent = {
        eventId: v4(),
        eventName: AccountUserDeletedEventName,
        aggregateName: AccountUserAggregateName,
        aggregateId: accountUser._meta.id,
        eventCreatedAt: new Date(),
    };
    await persist(deleteAccountUserEvent);
    if (onDelete) {
        await onDelete({
            accountUser,
        });
    }
    return deleteAccountUserEvent;
};
