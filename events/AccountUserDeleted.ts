import { AggregateEvent } from '../eventsourcing/AggregateEvent';

export const AccountUserDeletedEventName = 'AccountUserDeleted';

export type AccountUserDeletedEvent = AggregateEvent;
