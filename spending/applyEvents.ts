import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import { Spending, SpendingAggregateName } from './Spending'
import {
	AggregatePresentation,
	AggregateSnapshot,
	Create,
	Delete,
	Update,
} from '../eventsourcing/presenter/presentation'
import {
	SpendingCreatedEvent,
	SpendingCreatedEventName,
} from '../events/SpendingCreated'
import { SpendingDeletedEventName } from '../events/SpendingDeleted'
import {
	SpendingUpdatedEvent,
	SpendingUpdatedEventName,
} from '../events/SpendingUpdated'

export const applyEvents = (
	snapshot: AggregateSnapshot<Spending>,
	events: AggregateEvent[],
): AggregatePresentation =>
	events.reduce((presentation, event) => {
		switch (event.eventName) {
			case SpendingCreatedEventName:
				return (createPayload =>
					Create<Spending>({
						...createPayload,
						bookedAt: new Date(createPayload.bookedAt),
						_meta: {
							name: SpendingAggregateName,
							id: snapshot.aggregateId,
							version: 1,
							createdAt: event.eventCreatedAt,
						},
					}))((event as SpendingCreatedEvent).eventPayload)
			case SpendingUpdatedEventName:
				return ((aggregateToUpdate, updatePayload) =>
					Update<Spending>({
						...aggregateToUpdate,
						...(updatePayload.booked &&
							'set' in updatePayload.booked && {
								booked: updatePayload.booked.set,
							}),
						_meta: {
							...aggregateToUpdate._meta,
							version: aggregateToUpdate._meta.version + 1,
							deletedAt: event.eventCreatedAt,
						},
					}))(
					(presentation as AggregateSnapshot<Spending>)
						.aggregate as Spending,
					(event as SpendingUpdatedEvent).eventPayload,
				)
			case SpendingDeletedEventName:
				return (aggregateToDelete =>
					Delete<Spending>({
						...aggregateToDelete,
						_meta: {
							...aggregateToDelete._meta,
							version: aggregateToDelete._meta.version + 1,
							deletedAt: event.eventCreatedAt,
						},
					}))(
					(presentation as AggregateSnapshot<Spending>)
						.aggregate as Spending,
				)
			default:
				return presentation
		}
	}, snapshot as AggregatePresentation)
