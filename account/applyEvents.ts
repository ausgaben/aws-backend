import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import { Account, AccountAggregateName } from './Account'
import {
	AggregatePresentation,
	AggregateSnapshot,
	Create,
	Delete,
} from '../eventsourcing/presenter/presentation'
import {
	AccountCreatedEvent,
	AccountCreatedEventName,
} from '../events/AccountCreated'
import { AccountDeletedEventName } from '../events/AccountDeleted'

export const applyEvents = (
	snapshot: AggregateSnapshot<Account>,
	events: AggregateEvent[],
): AggregatePresentation =>
	events.reduce((presentation, event) => {
		switch (event.eventName) {
			case AccountCreatedEventName:
				return (({ name, isSavingsAccount }) =>
					Create<Account>({
						name,
						isSavingsAccount,
						_meta: {
							name: AccountAggregateName,
							id: snapshot.aggregateId,
							version: 1,
							createdAt: event.eventCreatedAt,
						},
					}))((event as AccountCreatedEvent).eventPayload)
			case AccountDeletedEventName:
				return (aggregate =>
					Delete({
						...aggregate,
						_meta: {
							...aggregate._meta,
							version: aggregate._meta.version + 1,
							deletedAt: event.eventCreatedAt,
						},
					}))(
					(presentation as AggregateSnapshot<Account>)
						.aggregate as Account,
				)
			default:
				return presentation
		}
	}, snapshot as AggregatePresentation)
