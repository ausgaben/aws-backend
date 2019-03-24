import { Event } from './Event';

export type AggregateEvent = Event & {
    aggregateId: string;
    aggregateName: string;
};

export type AggregateEventWithPayload<
    P = { [key: string]: any }
> = AggregateEvent & {
    eventPayload: P;
};
