import * as t from 'io-ts'
import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getById'
import * as AccountUserRepository from '../accountUser/repository/findByUserId'
import { UUIDv4 } from '../validation/UUIDv4'
import { CognitoUserId } from '../validation/CognitoUserId'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { v4 } from 'uuid'
import { Spending, SpendingAggregateName } from '../spending/Spending'
import { canAccessAccount } from '../accountUser/canAccessAccount'
import {
	SpendingUpdatedEvent,
	SpendingUpdatedEventName,
} from '../events/SpendingUpdated'
import { isLeft, left, Either, right } from 'fp-ts/lib/Either'
import { DateFromString } from '../validation/DateFromString'
import { NonEmptyString } from '../validation/NonEmptyString'
import { NonZeroInteger } from '../validation/NonZeroInteger'
import { currencies } from '../currency/currencies'

export const updateSpending = (
	persist: (ev: AggregateEvent) => Promise<void>,
	getSpendingById: AggregateRepository.getById<Spending>,
	findAccountUserByUserId: AccountUserRepository.findByUserId,
	onUpdate?: (args: { spending: Spending }) => Promise<any>,
) => async (args: {
	spendingId: string
	userId: string
	booked?: boolean
	bookedAt?: string
	category?: string
	description?: string
	amount?: number
	currencyId?: string
}): Promise<Either<Error, SpendingUpdatedEvent>> => {
	const validInput = t
		.type({
			spendingId: UUIDv4,
			userId: CognitoUserId,
			booked: t.union([t.undefined, t.boolean]),
			bookedAt: t.union([t.undefined, DateFromString]),
			category: t.union([t.undefined, NonEmptyString]),
			description: t.union([t.undefined, NonEmptyString]),
			amount: t.union([t.undefined, NonZeroInteger]),
			currencyId: t.union([
				t.undefined,
				t.keyof(
					currencies.reduce((obj, { id }) => {
						obj[id] = null
						return obj
					}, {} as { [key: string]: null }),
				),
			]),
		})
		.decode(args)

	if (isLeft(validInput))
		return left(
			new ValidationFailedError('updateSpending()', validInput.left),
		)

	const {
		spendingId,
		userId,
		booked,
		bookedAt,
		category,
		description,
		amount,
		currencyId,
	} = validInput.right

	const spending = await getSpendingById(spendingId)

	await canAccessAccount(findAccountUserByUserId)({
		userId,
		accountId: spending.accountId,
	})

	const updateSpendingEvent: SpendingUpdatedEvent = {
		eventId: v4(),
		eventName: SpendingUpdatedEventName,
		aggregateName: SpendingAggregateName,
		aggregateId: spending._meta.id,
		eventCreatedAt: new Date(),
		eventPayload: {
			...(booked !== undefined && { booked: { set: booked } }),
			...(bookedAt !== undefined && { bookedAt: { set: bookedAt } }),
			...(category !== undefined && { category: { set: category } }),
			...(description !== undefined && {
				description: { set: description },
			}),
			...(amount !== undefined && { amount: { set: amount } }),
			...(currencyId !== undefined && {
				currencyId: { set: currencyId as string },
			}),
		},
	}
	await persist(updateSpendingEvent)
	await onUpdate?.({
		spending,
	})
	return right(updateSpendingEvent)
}
