import * as t from 'io-ts'
import {
	AccountCreatedEvent,
	AccountCreatedEventName,
} from '../events/AccountCreated'
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'
import { CognitoUserId } from '../validation/CognitoUserId'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { NonEmptyString } from '../validation/NonEmptyString'
import { v4 } from 'uuid'
import { AccountAggregateName } from '../account/Account'
import { getOrElseL } from '../fp-compat/getOrElseL'
import { findCurrencyById } from '../currency/currencies'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'

export const createAccount = (
	persist: (ev: AggregateEventWithPayload) => Promise<void>,
) => async (args: {
	name: string
	isSavingsAccount: boolean
	userId: string
	defaultCurrencyId: string
}): Promise<AccountCreatedEvent> => {
	const { name, isSavingsAccount, defaultCurrencyId } = getOrElseL(
		t
			.type({
				name: NonEmptyString,
				userId: CognitoUserId,
				isSavingsAccount: t.boolean,
				defaultCurrencyId: NonEmptyString,
			})
			.decode(args),
	)(errors => {
		throw new ValidationFailedError('createAccount()', errors)
	})
	const defaultCurrency = findCurrencyById(defaultCurrencyId)
	if (!defaultCurrency) {
		throw new EntityNotFoundError(
			`createAccount(): Unknown currency ${defaultCurrencyId}!`,
		)
	}
	const e: AccountCreatedEvent = {
		eventId: v4(),
		eventName: AccountCreatedEventName,
		aggregateName: AccountAggregateName,
		aggregateId: v4(),
		eventCreatedAt: new Date(),
		eventPayload: {
			name,
			isSavingsAccount,
			defaultCurrencyId: defaultCurrency.id,
		},
	}
	await persist(e)
	return e
}
