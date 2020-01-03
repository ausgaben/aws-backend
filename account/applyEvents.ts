import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import { Account, AccountAggregateName } from './Account'
import {
	AggregatePresentation,
	AggregateSnapshot,
	Create,
	Delete,
	Update,
} from '../eventsourcing/presenter/presentation'
import {
	AccountCreatedEvent,
	AccountCreatedEventName,
} from '../events/AccountCreated'
import { AccountDeletedEventName } from '../events/AccountDeleted'
import { EUR, findCurrencyById } from '../currency/currencies'
import {
	AccountUpdatedEvent,
	AccountUpdatedEventName,
} from '../events/AccountUpdated'

export const applyEvents = (
	snapshot: AggregateSnapshot<Account>,
	events: AggregateEvent[],
): AggregatePresentation =>
	events.reduce((presentation, event) => {
		switch (event.eventName) {
			case AccountCreatedEventName:
				return (({ name, isSavingsAccount, defaultCurrencyId }) =>
					Create<Account>({
						name,
						isSavingsAccount,
						defaultCurrency: defaultCurrencyId
							? findCurrencyById(defaultCurrencyId) || EUR
							: EUR,
						_meta: {
							name: AccountAggregateName,
							id: snapshot.aggregateId,
							version: 1,
							createdAt: event.eventCreatedAt,
						},
					}))((event as AccountCreatedEvent).eventPayload)
			case AccountUpdatedEventName:
				return ((aggregateToUpdate, updatePayload) =>
					Update<Account>({
						...aggregateToUpdate,
						...(updatePayload.defaultCurrencyId &&
							'set' in updatePayload.defaultCurrencyId && {
								defaultCurrency:
									findCurrencyById(
										updatePayload.defaultCurrencyId.set,
									) || EUR,
							}),
						_meta: {
							...aggregateToUpdate._meta,
							version: aggregateToUpdate._meta.version + 1,
							deletedAt: event.eventCreatedAt,
						},
					}))(
					(presentation as AggregateSnapshot<Account>)
						.aggregate as Account,
					(event as AccountUpdatedEvent).eventPayload,
				)
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
