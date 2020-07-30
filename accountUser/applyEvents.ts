import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import { AccountUser, AccountUserAggregateName } from './AccountUser'
import {
	AggregatePresentation,
	AggregateSnapshot,
	Create,
	Delete,
} from '../eventsourcing/presenter/presentation'
import {
	AccountUserCreatedEvent,
	AccountUserCreatedEventName,
} from '../events/AccountUserCreated'
import { AccountUserDeletedEventName } from '../events/AccountUserDeleted'

export const applyEvents = (
	snapshot: AggregateSnapshot<AccountUser>,
	events: AggregateEvent[],
): AggregatePresentation =>
	events.reduce((presentation, event) => {
		switch (event.eventName) {
			case AccountUserCreatedEventName:
				return (({ accountId, userId }) =>
					Create<AccountUser>({
						accountId,
						userId,
						_meta: {
							name: AccountUserAggregateName,
							id: snapshot.aggregateId,
							version: 1,
							createdAt: event.eventCreatedAt,
						},
					}))((event as AccountUserCreatedEvent).eventPayload)
			case AccountUserDeletedEventName:
				return ((aggregate) =>
					Delete({
						...aggregate,
						_meta: {
							...aggregate._meta,
							version: aggregate._meta.version + 1,
							deletedAt: event.eventCreatedAt,
						},
					}))(
					(presentation as AggregateSnapshot<AccountUser>)
						.aggregate as AccountUser,
				)
			default:
				return presentation
		}
	}, snapshot as AggregatePresentation)
