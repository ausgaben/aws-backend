import * as t from 'io-ts';
import {
    AccountDeletedEvent,
    AccountDeletedEventName,
} from '../events/AccountDeleted';
import { Account, AccountAggregateName } from '../account/Account';
import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getByUUID';
import * as AccountUserRepository from '../accountUser/repository/findByUserId';
import { AccessDeniedError } from '../errors/AccessDeniedError';
import { UUIDv4 } from '../validation/UUIDv4';
import { CognitoUserId } from '../validation/CognitoUserId';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { v4 } from 'uuid';
import { AccountUser } from '../accountUser/AccountUser';

export const deleteAccount = (
    persist: (ev: AggregateEvent) => Promise<void>,
    getAccountByUUID: AggregateRepository.getByUUID<Account>,
    findAccountUserByUserId: AccountUserRepository.findByUserId,
    onDelete?: (args: {
        account: Account;
        accountUser: AccountUser;
    }) => Promise<any>,
) => async (args: {
    accountId: string;
    userId: string;
}): Promise<AccountDeletedEvent> => {
    const { accountId, userId } = t
        .type({
            accountId: UUIDv4,
            userId: CognitoUserId,
        })
        .decode(args)
        .getOrElseL(errors => {
            throw new ValidationFailedError('deleteAccount()', errors);
        });

    const [account, userAccounts] = await Promise.all([
        getAccountByUUID(accountId),
        findAccountUserByUserId(userId),
    ]);
    const accountUser = userAccounts.items.find(
        ({ accountId: a }) => a === accountId,
    );
    if (!accountUser) {
        throw new AccessDeniedError(
            `User "${userId}" is not allowed to access account "${account}`,
        );
    }

    const deleteAccountEvent: AccountDeletedEvent = {
        eventUUID: v4(),
        eventName: AccountDeletedEventName,
        aggregateName: AccountAggregateName,
        aggregateUUID: account._meta.uuid,
        eventCreatedAt: new Date(),
    };
    await persist(deleteAccountEvent);
    if (onDelete) {
        await onDelete({
            account,
            accountUser,
        });
    }
    return deleteAccountEvent;
};
