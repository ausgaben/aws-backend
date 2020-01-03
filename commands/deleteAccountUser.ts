import * as t from 'io-ts'
import {
	AccountUserDeletedEvent,
	AccountUserDeletedEventName,
} from '../events/AccountUserDeleted'
import {
	AccountUser,
	AccountUserAggregateName,
} from '../accountUser/AccountUser'
import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getById'
import { UUIDv4 } from '../validation/UUIDv4'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { v4 } from 'uuid'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

export const deleteAccountUser = (
	persist: (ev: AggregateEvent) => Promise<void>,
	getAccountUserById: AggregateRepository.getById<AccountUser>,
	onDelete?: (args: { accountUser: AccountUser }) => Promise<void>,
) => async (args: {
	accountUserId: string
}): Promise<Either<Error, AccountUserDeletedEvent>> => {
	const validInput = t
		.type({
			accountUserId: UUIDv4,
		})
		.decode(args)
	if (isLeft(validInput))
		return left(
			new ValidationFailedError('deleteAccountUser()', validInput.left),
		)
	const { accountUserId } = validInput.right

	const accountUser = await getAccountUserById(accountUserId)

	const deleteAccountUserEvent: AccountUserDeletedEvent = {
		eventId: v4(),
		eventName: AccountUserDeletedEventName,
		aggregateName: AccountUserAggregateName,
		aggregateId: accountUser._meta.id,
		eventCreatedAt: new Date(),
	}
	await persist(deleteAccountUserEvent)
	if (onDelete) {
		await onDelete({
			accountUser,
		})
	}
	return right(deleteAccountUserEvent)
}
