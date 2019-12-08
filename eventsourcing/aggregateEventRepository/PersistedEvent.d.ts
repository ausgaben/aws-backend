import { AggregateEvent } from '../AggregateEvent'

export type PersistedEvent = AggregateEvent & {
	insertedAtNanotime: string
	eventPayload?: { [key: string]: any }
}
