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
    SpendingUpdatedEvent,
    SpendingUpdatedEventName,
} from '../events/SpendingUpdated';

export const updateSpending = (
    persist: (ev: AggregateEvent) => Promise<void>,
    getSpendingById: AggregateRepository.getById<Spending>,
    findAccountUserByUserId: AccountUserRepository.findByUserId,
    onUpdate?: (args: { spending: Spending }) => Promise<any>,
) => {
    const checkAccess = canAccessAccount(findAccountUserByUserId);

    return async (args: {
        spendingId: string;
        userId: string;
        booked?: boolean;
    }): Promise<SpendingUpdatedEvent> => {
        const { spendingId, userId, booked } = t
            .type({
                spendingId: UUIDv4,
                userId: CognitoUserId,
                booked: t.union([t.undefined, t.boolean]),
            })
            .decode(args)
            .getOrElseL(errors => {
                throw new ValidationFailedError('updateSpending()', errors);
            });

        const spending = await getSpendingById(spendingId);

        await checkAccess({
            userId,
            accountId: spending.accountId,
        });

        const updateSpendingEvent: SpendingUpdatedEvent = {
            eventId: v4(),
            eventName: SpendingUpdatedEventName,
            aggregateName: SpendingAggregateName,
            aggregateId: spending._meta.id,
            eventCreatedAt: new Date(),
            eventPayload: {
                ...(booked && { booked: { set: booked } }),
            },
        };
        await persist(updateSpendingEvent);
        if (onUpdate) {
            await onUpdate({
                spending,
            });
        }
        return updateSpendingEvent;
    };
};