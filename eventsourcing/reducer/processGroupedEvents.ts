import { AggregateEvent, AggregateEventWithPayload } from '../AggregateEvent'
import { findById } from '../aggregateRepository/findById'
import {
	AggregatePresentation,
	AggregatePresentationStates,
	AggregateSnapshot,
	CreateAggregatePresentation,
	DeleteAggregatePresentation,
	Snapshot,
} from '../presenter/presentation'
import { Aggregate } from '../aggregateRepository/Aggregate'
import { persist as persistFn } from '../aggregateRepository/persist'
import { remove as removeFn } from '../aggregateRepository/remove'

type AggregateEvents = {
	[key: string]: (AggregateEvent | AggregateEventWithPayload)[]
}

/**
 * Process the grouped events for an aggregate
 */
export const processGroupedEvents = async <A extends Aggregate>(
	events: AggregateEvents,
	applyEvents: (
		snapshot: AggregateSnapshot<A>,
		events: (AggregateEvent | AggregateEventWithPayload)[],
	) => AggregatePresentation,
	findAggregate: findById<A>,
	persist: persistFn<A>,
	remove: removeFn<A>,
): Promise<void> => {
	await Promise.all(
		Object.keys(events).map(async (aggregateId) => {
			try {
				// Load the snapshot of the aggregate
				const aggregate = await findAggregate(aggregateId)
				// Apply the events to the snapshot
				const presentation = applyEvents(
					Snapshot<A>(aggregateId, aggregate),
					events[aggregateId],
				)
				// Persist the changes
				switch (presentation.type) {
					case AggregatePresentationStates.Create:
					case AggregatePresentationStates.Update:
						await persist(
							(presentation as CreateAggregatePresentation<A>)
								.aggregate,
						)
						break
					case AggregatePresentationStates.Delete:
						await remove(
							(presentation as DeleteAggregatePresentation<A>)
								.aggregate,
						)
				}
			} catch (error) {
				console.error(error)
				console.error('Processing grouped events failed!')
				console.error(
					JSON.stringify({
						events,
						error,
					}),
				)
			}
		}),
	)
}
