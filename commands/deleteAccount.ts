import * as t from 'io-ts'
import {
	AccountDeletedEvent,
	AccountDeletedEventName,
} from '../events/AccountDeleted'
import { Account, AccountAggregateName } from '../account/Account'
import { AggregateEvent } from '../eventsourcing/AggregateEvent'
import * as AggregateRepository from '../eventsourcing/aggregateRepository/getById'
import * as AccountUserRepository from '../accountUser/repository/findByUserId'
import { AccessDeniedError } from '../errors/AccessDeniedError'
import { UUIDv4 } from '../validation/UUIDv4'
import { CognitoUserId } from '../validation/CognitoUserId'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { v4 } from 'uuid'
import { AccountUser } from '../accountUser/AccountUser'
import { getOrElseL } from '../fp-compat/getOrElseL'

export const deleteAccount = (
	persist: (ev: AggregateEvent) => Promise<void>,
	getAccountById: AggregateRepository.getById<Account>,
	findAccountUserByUserId: AccountUserRepository.findByUserId,
	onDelete?: (args: {
		account: Account
		accountUser: AccountUser
	}) => Promise<any>,
) => async (args: {
	accountId: string
	userId: string
}): Promise<AccountDeletedEvent> => {
	const { accountId, userId } = getOrElseL(
		t
			.type({
				accountId: UUIDv4,
				userId: CognitoUserId,
			})
			.decode(args),
	)(errors => {
		throw new ValidationFailedError('deleteAccount()', errors)
	})

	const [account, userAccounts] = await Promise.all([
		getAccountById(accountId),
		findAccountUserByUserId(userId),
	])
	const accountUser = userAccounts.items.find(
		({ accountId: a }) => a === accountId,
	)
	if (!accountUser) {
		throw new AccessDeniedError(
			`User "${userId}" is not allowed to access account "${accountId}"!`,
		)
	}

	const deleteAccountEvent: AccountDeletedEvent = {
		eventId: v4(),
		eventName: AccountDeletedEventName,
		aggregateName: AccountAggregateName,
		aggregateId: account._meta.id,
		eventCreatedAt: new Date(),
	}
	await persist(deleteAccountEvent)
	if (onDelete) {
		await onDelete({
			account,
			accountUser,
		})
	}
	return deleteAccountEvent
}
