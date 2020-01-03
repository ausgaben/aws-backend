import * as t from 'io-ts'
import { AggregateEventWithPayload } from '../eventsourcing/AggregateEvent'
import {
	AccountUserCreatedEvent,
	AccountUserCreatedEventName,
} from '../events/AccountUserCreated'
import { CognitoUserId } from '../validation/CognitoUserId'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { v4 } from 'uuid'
import { UUIDv4 } from '../validation/UUIDv4'
import { AccountUserAggregateName } from '../accountUser/AccountUser'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import { tryOrError } from '../fp-compat/tryOrError'

export const createAccountUser = (
	persist: (ev: AggregateEventWithPayload) => Promise<void>,
) => async (args: {
	userId: string
	accountId: string
}): Promise<Either<Error, AccountUserCreatedEvent>> => {
	const validInput = t
		.type({
			accountId: UUIDv4,
			userId: CognitoUserId,
		})
		.decode(args)
	if (isLeft(validInput))
		return left(
			new ValidationFailedError('createAccountUser()', validInput.left),
		)
	const e: AccountUserCreatedEvent = {
		eventId: v4(),
		eventName: AccountUserCreatedEventName,
		aggregateName: AccountUserAggregateName,
		aggregateId: v4(),
		eventCreatedAt: new Date(),
		eventPayload: validInput.right,
	}
	const eventPersisted = await tryOrError(async () => persist(e))
	if (isLeft(eventPersisted)) return eventPersisted
	return right(e)
}
