import { GQLError } from '../../../appsync/GQLError'
import * as https from 'https'
import { Context } from 'aws-lambda'
import { InternalError } from '../../../errors/InternalError'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { AccessDeniedError } from '../../../errors/AccessDeniedError'
import { Sparebank1Transaction } from '../types'
import { findCurrencyById, NOK } from '../../../currency/currencies'
import { GraphQLSpending } from '../../../appsync/types'

const tokensTable = process.env.TOKENS_TABLE
const db = new DynamoDBClient({})

export const handler = async (
	event: {
		cognitoIdentityId: string
		accountId: string
	},
	context: Context,
): Promise<
	| {
			items: GraphQLSpending[]
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

		const token = Item?.accessToken.S

		if (token === undefined)
			throw new AccessDeniedError(
				`No token configured for ${event.cognitoIdentityId}`,
			)

		const { transactions } = await new Promise<{
			transactions: Sparebank1Transaction[]
		}>((resolve, reject) => {
			const req = https.request(
				{
					host: 'api.sparebank1.no',
					method: 'GET',
					path: `/open/personal/banking/accounts/${event.accountId}/transactions`,
					headers: {
						'Content-Type': 'application/vnd.sparebank1.v1+json',
						Authorization: `Bearer ${token}`,
					},
				},
				(res) => {
					res.setEncoding('utf8')
					const response: string[] = []
					res.on('data', (chunk: string) => {
						console.debug(chunk)
						response.push(chunk)
					})
					res.on('end', () => {
						if (res.statusCode !== 200) {
							console.error(response.join(''))
							return reject(
								new Error(`Request failed: ${res.statusCode}`),
							)
						}
						resolve(JSON.parse(response.join('')))
					})
				},
			)
			req.on('error', reject)
			req.end()
		})

		return {
			items: transactions.map((t) => ({
				_meta: {
					createdAt: new Date(`${t.accountingDate}T12:00:00Z`), // FIXME: which timezone?
					id: `${t.accountingDate}-${t.description}-${
						t.remoteAccount
					}-${Math.round(t.amount.amount * 100)}-${
						t.amount.currencyCode
					}`,
					version: 1,
					name: `Sparebank1Transaction`,
				},
				accountId: event.accountId,
				amount: Math.round(t.amount.amount * 100),
				booked: true,
				bookedAt: new Date(
					`${t.accountingDate}T12:00:00Z`,
				).toISOString(), // FIXME: which timezone?
				category: t.transactionType ?? 'N/A',
				currency: findCurrencyById(t.amount.currencyCode) ?? NOK,
				description: t.description ?? 'N/A',
			})),
		}
	} catch (err) {
		console.error(err)
		return GQLError(context, new InternalError(err.message))
	}
}
