import * as t from 'io-ts';
import { NonEmptyString } from '../validation/NonEmptyString';
import { AggregateEventWithPayload } from '../events/AggregateEvent';

export const AccountCreatedEventName = 'AccountCreated';

export type AccountCreatedEvent = AggregateEventWithPayload<{
    name: string;
    isSavingsAccount: boolean;
}>;

export const AccountCreatedEventPayload = t.type({
    name: NonEmptyString,
    isSavingsAccount: t.boolean,
});
