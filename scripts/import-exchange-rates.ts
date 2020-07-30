import { CloudFormation } from 'aws-sdk'
import { stackName } from '../aws/stackName'
import { Outputs } from '../aws/stacks/core'
import { promises as fs } from 'fs'
import {
	DynamoDBClient,
	BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node'

const cf = new CloudFormation({ region: process.env.AWS_REGION })
const db = new DynamoDBClient({ region: process.env.AWS_REGION })

const importFile = process.argv[process.argv.length - 1]
const currencyId = 'NOK'

const chunk = <A>(array: A[], chunkSize: number): A[][] => {
	const chunked = [] as A[][]
	let i = 0
	do {
		chunked.push(array.slice(i, i + chunkSize))
		i += chunkSize
	} while (i < array.length)
	return chunked
}

Promise.all([
	cf
		.describeStacks({
			StackName: stackName(),
		})
		.promise()
		.then(
			({ Stacks }) =>
				Stacks?.[0]?.Outputs?.reduce(
					(outputs, { OutputKey, OutputValue }) => ({
						...outputs,
						[`${OutputKey}`]: OutputValue as string,
					}),
					{} as { [key: string]: string },
				) as Outputs,
		)
		.then(({ exchangeRatesTableName }) => exchangeRatesTableName),
	fs.readFile(importFile, 'utf-8').then((s) =>
		s
			.trim()
			.split('\n')
			.map((l) => {
				const [date, rate] = l.trim().split('\t')
				return [date, parseFloat(rate)]
			}),
	),
])
	.then(async ([exchangeRatesTableName, rates]) =>
		Promise.all(
			chunk(rates, 25).map(async (rates) =>
				db.send(
					new BatchWriteItemCommand({
						RequestItems: {
							[exchangeRatesTableName]: rates.map(
								([date, rate]) => ({
									PutRequest: {
										Item: {
											currencyId: {
												S: currencyId,
											},
											date: {
												S: date as string,
											},
											rate: {
												N: (rate as number).toString(),
											},
										},
									},
								}),
							),
						},
					}),
				),
			),
		).then(() => {
			console.log(`Imported ${rates.length} exchange rates.`)
		}),
	)
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
