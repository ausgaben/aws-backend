import * as t from 'io-ts'
import {
	SpendingCreatedEvent,
	SpendingCreatedEventName,
} from '../events/SpendingCreated'
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { NonEmptyString } from '../validation/NonEmptyString'
import { v4 } from 'uuid'
import { SpendingAggregateName } from '../spending/Spending'
import { UUIDv4 } from '../validation/UUIDv4'
import { DateFromString } from '../validation/DateFromString'
import { NonZeroInteger } from '../validation/NonZeroInteger'
import { currencies } from '../currency/currencies'
import * as AccountUserRepository from '../accountUser/repository/findByUserId'
import { AccessDeniedError } from '../errors/AccessDeniedError'
import { CognitoUserId } from '../validation/CognitoUserId'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import { tryOrError } from '../fp-compat/tryOrError'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'

export const createSpending = (
	persist: (ev: AggregateEventWithPayload) => Promise<void>,
	findAccountUserByUserId: AccountUserRepository.findByUserId,
) => async (args: {
	userId: string
	accountId: string
	bookedAt: string
	category: string
	description: string
	amount: number
	currencyId: string
	booked?: boolean
}): Promise<Either<Error, SpendingCreatedEvent>> => {
	const validInput = t
		.type({
			userId: CognitoUserId,
			accountId: UUIDv4,
			bookedAt: DateFromString,
			category: NonEmptyString,
			description: NonEmptyString,
			amount: NonZeroInteger,
			currencyId: t.keyof(
				currencies.reduce((obj, { id }) => {
					obj[id] = null
					return obj
				}, {} as { [key: string]: null }),
			),
			booked: t.boolean,
		})
		.decode({
			booked: true,
			...args,
		})
	if (isLeft(validInput))
		return left(
			new ValidationFailedError('createSpending()', validInput.left),
		)
	const {
		userId,
		accountId,
		bookedAt,
		category,
		description,
		amount,
		currencyId,
		booked,
	} = validInput.right

	const userAccounts = await tryOrError(async () =>
		findAccountUserByUserId(userId),
	)
	if (isLeft(userAccounts))
		return left(
			new EntityNotFoundError(
				`Failed to find accounts for user "${userId}"!`,
			),
		)
	const accountUser = userAccounts.right.items.find(
		({ accountId: a }) => a === accountId,
	)
	if (!accountUser) {
		return left(
			new AccessDeniedError(
				`User "${userId}" is not allowed to access account "${accountId}"!`,
			),
		)
	}

	const e: SpendingCreatedEvent = {
		eventId: v4(),
		eventName: SpendingCreatedEventName,
		aggregateName: SpendingAggregateName,
		aggregateId: v4(),
		eventCreatedAt: new Date(),
		eventPayload: {
			accountId,
			bookedAt,
			category,
			description,
			amount,
			currencyId: currencyId as string,
			booked,
		},
	}
	const eventPersisted = await tryOrError(async () => persist(e))
	if (isLeft(eventPersisted)) return eventPersisted
	return right(e)
}
