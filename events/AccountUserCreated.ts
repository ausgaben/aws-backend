import * as t from 'io-ts';
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent';
import { UUIDv4 } from '../validation/UUIDv4';
import { CognitoUserId } from '../validation/CognitoUserId';

export const AccountUserCreatedEventName = 'AccountUserCreated';

export type AccountUserCreatedEvent = AggregateEventWithPayload<{
    accountId: string;
    userId: string;
}>;

export const AccountUserCreatedEventPayload = t.type({
    accountId: UUIDv4,
    userId: CognitoUserId,
});
