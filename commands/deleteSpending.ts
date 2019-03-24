import * as t from 'io-ts';
import { AggregateEvent } from '../eventsourcing/AggregateEvent';
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getById';
import * as AccountUserRepository from '../accountUser/repository/findByUserId';
import { UUIDv4 } from '../validation/UUIDv4';
import { CognitoUserId } from '../validation/CognitoUserId';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { v4 } from 'uuid';
import { Spending, SpendingAggregateName } from '../spending/Spending';
import { canAccessAccount } from '../accountUser/canAccessAccount';
import {
    SpendingDeletedEvent,
    SpendingDeletedEventName,
} from '../events/SpendingDeleted';

export const deleteSpending = (
    persist: (ev: AggregateEvent) => Promise<void>,
    getSpendingById: AggregateRepository.getById<Spending>,
    findAccountUserByUserId: AccountUserRepository.findByUserId,
    onDelete?: (args: { spending: Spending }) => Promise<any>,
) => {
    const checkAccess = canAccessAccount(findAccountUserByUserId);

    return async (args: {
        spendingId: string;
        userId: string;
    }): Promise<SpendingDeletedEvent> => {
        const { spendingId, userId } = t
            .type({
                spendingId: UUIDv4,
                userId: CognitoUserId,
            })
            .decode(args)
            .getOrElseL(errors => {
                throw new ValidationFailedError('deleteSpending()', errors);
            });

        const spending = await getSpendingById(spendingId);

        await checkAccess({
            userId,
            accountId: spending.accountId,
        });

        const deleteSpendingEvent: SpendingDeletedEvent = {
            eventId: v4(),
            eventName: SpendingDeletedEventName,
            aggregateName: SpendingAggregateName,
            aggregateId: spending._meta.id,
            eventCreatedAt: new Date(),
        };
        await persist(deleteSpendingEvent);
        if (onDelete) {
            await onDelete({
                spending,
            });
        }
        return deleteSpendingEvent;
    };
};
