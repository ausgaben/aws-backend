import { GQLError } from '../../../appsync/GQLError'
import * as https from 'https'
import * as querystring from 'querystring'
import { Context } from 'aws-lambda'
import { InternalError } from '../../../errors/InternalError'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { getClientConfig } from '../../clientConfig'
import { SSMClient } from '@aws-sdk/client-ssm'

const tokensTable = process.env.TOKENS_TABLE
const db = new DynamoDBClient({})

const stackName = process.env.STACK_NAME ?? ''
const config = getClientConfig({
	stackName,
	ssm: new SSMClient({}),
})

export const handler = async (
	event: {
		code: string
		cognitoIdentityId: string
	},
	context: Context,
): Promise<boolean | ReturnType<typeof GQLError>> => {
	console.debug(JSON.stringify(event))

	try {
		const { clientId, clientSecret, redirectUrl } = await config

		const token = await new Promise<{
			access_token: string
			token_type: 'Bearer'
			expires_in: number
			refresh_token: string
			scope: string
			state: string
			financial_institution_id:
				| 'fid-ostlandet'
				| 'fid-nord-norge'
				| 'fid-sr-bank'
				| 'fid-smn'
				| 'fid-telemark'
				| 'fid-hallingdal-valdres'
				| 'fid-lom-skjaak'
				| 'fid-gudbrandsdal'
				| 'fid-nordvest'
				| 'fid-modum'
				| 'fid-bv'
				| 'fid-ringerike-hadeland'
				| 'fid-sore-sunnmore'
				| 'fid-ostfold-akershus'
				| 'fid-helgeland'
			userinfo: {
				firstname: string
				lastname: string
				dateOfBirth: string // "YYYY-MM-DD"
			}
		}>((resolve, reject) => {
			const postData = querystring.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code: event.code,
				grant_type: 'authorization_code',
				state: 'ISSUE_OAUTH_TOKEN',
				redirect_uri: redirectUrl,
			})
			const req = https.request(
				{
					host: 'api.sparebank1.no',
					method: 'POST',
					path: '/oauth/token',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': Buffer.byteLength(postData),
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
						const token = JSON.parse(response.join())
						resolve({
							...token,
							userinfo: JSON.parse(token.userinfo),
						})
					})
				},
			)

			req.on('error', reject)
			req.write(postData)
			req.end()
		})
		console.log(token)

		await db.send(
			new PutItemCommand({
				TableName: tokensTable,
				Item: {
					cognitoIdentityId: {
						S: event.cognitoIdentityId,
					},
					accessToken: {
						S: token.access_token,
					},
					refreshToken: {
						S: token.refresh_token,
					},
					scope: {
						S: token.scope,
					},
					ttl: {
						N: `${
							Math.round(Date.now() / 1000) + token.expires_in
						}`,
					},
					fid: {
						S: token.financial_institution_id,
					},
					userInfo: {
						S: JSON.stringify(token.userinfo),
					},
				},
			}),
		)

		return true
	} catch (err) {
		return GQLError(context, new InternalError(err))
	}
}
