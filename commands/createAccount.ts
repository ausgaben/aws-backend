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
import { findCurrencyById } from '../currency/currencies'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import { tryOrError } from '../fp-compat/tryOrError'

export const createAccount = (
	persist: (ev: AggregateEventWithPayload) => Promise<void>,
) => async (args: {
	name: string
	isSavingsAccount: boolean
	userId: string
	defaultCurrencyId: string
}): Promise<Either<Error, AccountCreatedEvent>> => {
	const validInput = t
		.type({
			name: NonEmptyString,
			userId: CognitoUserId,
			isSavingsAccount: t.boolean,
			defaultCurrencyId: NonEmptyString,
		})
		.decode(args)
	if (isLeft(validInput))
		return left(
			new ValidationFailedError('createAccount()', validInput.left),
		)

	const { name, isSavingsAccount, defaultCurrencyId } = validInput.right
	const defaultCurrency = findCurrencyById(defaultCurrencyId)
	if (!defaultCurrency) {
		// FIXME: Replace with Either
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
	const eventPersisted = await tryOrError(async () => persist(e))
	if (isLeft(eventPersisted)) return eventPersisted
	return right(e)
}
