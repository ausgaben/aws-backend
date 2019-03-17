import { Event } from './Event';

export type AggregateEvent = Event & {
    aggregateUUID: string;
    aggregateName: string;
};

export type AggregateEventWithPayload<
    P = { [key: string]: any }
> = AggregateEvent & {
    eventPayload: P;
};
