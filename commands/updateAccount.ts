import * as t from 'io-ts'
import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import * as AccountUserRepository from '../accountUser/repository/findByUserId'
import { UUIDv4 } from '../validation/UUIDv4'
import { CognitoUserId } from '../validation/CognitoUserId'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { v4 } from 'uuid'
import { AccountAggregateName, Account } from '../account/Account'
import { canAccessAccount } from '../accountUser/canAccessAccount'
import {
	AccountUpdatedEvent,
	AccountUpdatedEventName,
} from '../events/AccountUpdated'
import { NonEmptyString } from '../validation/NonEmptyString'
import { isLeft, Either, left, right } from 'fp-ts/lib/Either'
import { findCurrencyById } from '../currency/currencies'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'
import { ConflictError } from '../errors/ConflictError'
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getById'
import { tryOrError } from '../fp-compat/tryOrError'
import { NonZeroInteger } from '../validation/NonZeroInteger'

export const updateAccount = (
	persist: (ev: AggregateEvent) => Promise<void>,
	getAccountById: AggregateRepository.getById<Account>,
	findAccountUserByUserId: AccountUserRepository.findByUserId,
) => {
	const checkAccess = canAccessAccount(findAccountUserByUserId)

	return async (args: {
		accountId: string
		userId: string
		expectedVersion: number
		name: string
		defaultCurrencyId?: string
	}): Promise<Either<Error, AccountUpdatedEvent>> => {
		const validInput = t
			.type({
				accountId: UUIDv4,
				userId: CognitoUserId,
				name: NonEmptyString,
				defaultCurrencyId: t.union([
					t.undefined,
					t.null,
					NonEmptyString,
				]),
				expectedVersion: NonZeroInteger,
			})
			.decode(args)
		if (isLeft(validInput)) {
			return left(
				new ValidationFailedError('updateAccount()', validInput.left),
			)
		}

		console.log({
			validInput: validInput.right,
		})

		const {
			accountId,
			userId,
			defaultCurrencyId,
			expectedVersion,
			name,
		} = validInput.right

		if (defaultCurrencyId) {
			if (!findCurrencyById(defaultCurrencyId))
				return left(
					new EntityNotFoundError(
						`updateAccount(): Unknown currency: ${defaultCurrencyId}!`,
					),
				)
		}

		const canAccess = await checkAccess({
			userId,
			accountId,
		})

		if (isLeft(canAccess)) return canAccess

		const foundAccount = await tryOrError(async () =>
			getAccountById(accountId),
		)

		if (isLeft(foundAccount)) return foundAccount

		if (foundAccount.right._meta.version !== expectedVersion)
			return left(
				new ConflictError(
					`Version mismatch! Expected ${expectedVersion}, got ${foundAccount.right._meta.version}.`,
				),
			)

		const updateAccountEvent: AccountUpdatedEvent = {
			eventId: v4(),
			eventName: AccountUpdatedEventName,
			aggregateName: AccountAggregateName,
			aggregateId: accountId,
			eventCreatedAt: new Date(),
			eventPayload: {
				...(defaultCurrencyId && {
					defaultCurrencyId: { set: defaultCurrencyId },
				}),
				...(name !== foundAccount.right.name && {
					name: { set: name },
				}),
			},
		}
		const eventPersisted = await tryOrError(async () =>
			persist(updateAccountEvent),
		)
		if (isLeft(eventPersisted)) return eventPersisted

		return right(updateAccountEvent)
	}
}
