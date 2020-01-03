import * as t from 'io-ts'
import * as AccountUserRepository from './repository/findByUserId'
import { AccessDeniedError } from '../errors/AccessDeniedError'
import { UUIDv4 } from '../validation/UUIDv4'
import { CognitoUserId } from '../validation/CognitoUserId'
import { ValidationFailedError } from '../errors/ValidationFailedError'
import { isLeft, Either, left, right } from 'fp-ts/lib/Either'
import { tryOrError } from '../fp-compat/tryOrError'
import { EntityNotFoundError } from '../errors/EntityNotFoundError'

export const canAccessAccount = (
	findAccountUserByUserId: AccountUserRepository.findByUserId,
) => async (args: {
	accountId: string
	userId: string
}): Promise<Either<Error, { accountId: string; userId: string }>> => {
	const validInput = t
		.type({
			accountId: UUIDv4,
			userId: CognitoUserId,
		})
		.decode(args)
	if (isLeft(validInput)) {
		return left(
			new ValidationFailedError('canAccessAccount()', validInput.left),
		)
	}

	const { userId, accountId } = validInput.right

	const userAccounts = await tryOrError(async () =>
		findAccountUserByUserId(userId),
	)
	if (isLeft(userAccounts))
		return left(new EntityNotFoundError(userAccounts.left.message))
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
	return right({
		userId,
		accountId,
	})
}
