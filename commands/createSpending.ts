import * as t from 'io-ts';
import {
    SpendingCreatedEvent,
    SpendingCreatedEventName,
} from '../events/SpendingCreated';
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { NonEmptyString } from '../validation/NonEmptyString';
import { v4 } from 'uuid';
import { SpendingAggregateName } from '../spending/Spending';
import { UUIDv4 } from '../validation/UUIDv4';
import { DateFromString } from '../validation/DateFromString';
import { NonZeroInteger } from '../validation/NonZeroInteger';
import { currencies } from '../currency/currencies';
import * as AccountUserRepository from '../accountUser/repository/findByUserId';
import { AccessDeniedError } from '../errors/AccessDeniedError';
import { CognitoUserId } from '../validation/CognitoUserId';

export const createSpending = (
    persist: (ev: AggregateEventWithPayload) => Promise<void>,
    findAccountUserByUserId: AccountUserRepository.findByUserId,
) => async (args: {
    userId: string;
    accountId: string;
    bookedAt: string;
    category: string;
    description: string;
    amount: number;
    currencyId: string;
    booked?: boolean;
    paidWith?: string;
}): Promise<SpendingCreatedEvent> => {
    const {
        userId,
        accountId,
        bookedAt,
        category,
        description,
        amount,
        currencyId,
        booked,
        paidWith,
    } = t
        .type({
            userId: CognitoUserId,
            accountId: UUIDv4,
            bookedAt: DateFromString,
            category: NonEmptyString,
            description: NonEmptyString,
            amount: NonZeroInteger,
            currencyId: t.keyof(
                currencies.reduce(
                    (obj, { id }) => {
                        obj[id] = null;
                        return obj;
                    },
                    {} as { [key: string]: null },
                ),
            ),
            booked: t.boolean,
            paidWith: t.union([t.null, NonEmptyString]),
        })
        .decode({
            booked: true,
            ...args,
        })
        .getOrElseL(errors => {
            throw new ValidationFailedError('createSpending()', errors);
        });

    const userAccounts = await findAccountUserByUserId(userId);
    const accountUser = userAccounts.items.find(
        ({ accountId: a }) => a === accountId,
    );
    if (!accountUser) {
        throw new AccessDeniedError(
            `User "${userId}" is not allowed to access account "${accountId}"!`,
        );
    }

    const e: SpendingCreatedEvent = {
        eventId: v4(),
        eventName: SpendingCreatedEventName,
        aggregateName: SpendingAggregateName,
        aggregateId: v4(),
        eventCreatedAt: new Date(),
        eventPayload: {
            accountId,
            bookedAt,
            category,
            description,
            amount,
            currencyId: currencyId as string,
            booked,
            ...(paidWith && { paidWith }),
        },
    };
    await persist(e);
    return e;
};
