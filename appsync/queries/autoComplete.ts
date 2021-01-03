import { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { GQLError } from '../GQLError'
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId'
import { findByAccountId } from '../../autoComplete/repository/dynamodb/findByAccountId'
import { canAccessAccount } from '../../accountUser/canAccessAccount'
import { isLeft } from 'fp-ts/lib/Either'

const db = new DynamoDBClient({})
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE as string

const findAccountUserByUserId = findByUserId(db, accountUsersTableName)

const accountAutoCompleteTable = process.env
	.ACCOUNT_AUTOCOMPLETE_TABLE as string

const findAutoCompleteByAccountId = findByAccountId(
	db,
	accountAutoCompleteTable,
)

const checkAccess = canAccessAccount(findAccountUserByUserId)

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
	},
	context: Context,
): Promise<
	{ field: string; strings: string[] }[] | ReturnType<typeof GQLError>
> => {
	try {
		const canAccess = await checkAccess({
			userId: event.cognitoIdentityId,
			accountId: event.accountId,
		})
		if (isLeft(canAccess)) return GQLError(context, canAccess.left)
		const autoCompleteStrings = await findAutoCompleteByAccountId({
			accountId: event.accountId,
		})
		return Object.keys(autoCompleteStrings).map((field) => ({
			field,
			strings: autoCompleteStrings[field],
		}))
	} catch (error) {
		return GQLError(context, error)
	}
}
