import { GQLError } from '../../../appsync/GQLError'
import * as https from 'https'
import { Context } from 'aws-lambda'
import { InternalError } from '../../../errors/InternalError'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { AccessDeniedError } from '../../../errors/AccessDeniedError'
import { Account } from '../../../account/Account'
import { findCurrencyById, NOK } from '../../../currency/currencies'
import { Links, Sparebank1Account } from '../types'

const tokensTable = process.env.TOKENS_TABLE
const db = new DynamoDBClient({})

export const handler = async (
	event: {
		cognitoIdentityId: string
	},
	context: Context,
): Promise<
	| {
			items: Account[]
			nextStartKey?: string
	  }
	| ReturnType<typeof GQLError>
> => {
	console.debug(JSON.stringify(event))

	try {
		const { Item } = await db.send(
			new GetItemCommand({
				TableName: tokensTable,
				Key: {
					cognitoIdentityId: {
						S: event.cognitoIdentityId,
					},
				},
			}),
		)

		if (Item === undefined)
			throw new AccessDeniedError(
				`No token configured for ${event.cognitoIdentityId}`,
			)

		const token = Item.accessToken.S

		const { accounts } = await new Promise<{
			accounts: Sparebank1Account[]
			_links: Links
		}>((resolve, reject) => {
			const req = https.request(
				{
					host: 'api.sparebank1.no',
					method: 'GET',
					path: '/open/personal/banking/accounts/all',
					headers: {
						'Content-Type': 'application/vnd.sparebank1.v1+json',
						Authorization: `Bearer ${token}`,
					},
				},
				(res) => {
					res.setEncoding('utf8')
					const response: string[] = []
					res.on('data', (chunk: string) => {
						response.push(chunk)
					})
					res.on('end', () => {
						if (res.statusCode !== 200) {
							console.error(response.join(''))
							return reject(
								new Error(`Request failed: ${res.statusCode}`),
							)
						}
						resolve(JSON.parse(response.join()))
					})
				},
			)
			req.on('error', reject)
			req.end()
		})

		return {
			items: accounts.map((account) => ({
				_meta: {
					createdAt: new Date(),
					id: account.id,
					name: `Sparebank1Account`,
					version: 1,
				},
				defaultCurrency:
					findCurrencyById(account.balance.currencyCode) ?? NOK,
				isSavingsAccount: account.type === 'SAVING',
				name: `${account.name} (${account.accountNumber.formatted})`,
			})),
		}
	} catch (err) {
		return GQLError(context, new InternalError(err))
	}
}
