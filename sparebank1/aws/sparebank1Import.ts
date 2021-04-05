import { Construct, Stack } from '@aws-cdk/core'
import { Code, ILayerVersion } from '@aws-cdk/aws-lambda'
import { AggregateEventsTable } from '../../aws/resources/aggregate-events-table'
import { gqlLambda } from '../../aws/resources/gqlLambda'
import { ApiFeature } from '../../aws/features/api'
import { TokensTable } from './TokensTable'
import { PolicyStatement } from '@aws-cdk/aws-iam'

export class Sparebank1ImportFeature extends Construct {
	public readonly tokensTable: TokensTable
	constructor(
		stack: Stack,
		id: string,
		lambdas: {
			sparebank1OAuthCallback: Code
			sparebank1transactions: Code
			sparebank1accounts: Code
		},
		baseLayer: ILayerVersion,
		aggregateEventsTable: AggregateEventsTable,
		apiFeature: ApiFeature,
	) {
		super(stack, id)

		this.tokensTable = new TokensTable(stack, 'sparebank1Tokens')

		gqlLambda(
			this,
			stack,
			baseLayer,
			apiFeature.api,
			'sparebank1OAuthCallback',
			'Mutation',
			lambdas.sparebank1OAuthCallback,
			{
				write: {
					AGGREGATE_EVENTS_TABLE: aggregateEventsTable,
					TOKENS_TABLE: this.tokensTable,
				},
			},
			{
				STACK_NAME: stack.stackName,
			},
		).addToRolePolicy(
			new PolicyStatement({
				actions: ['ssm:GetParametersByPath'],
				resources: [
					`arn:aws:ssm:${stack.region}:${stack.account}:parameter/${stack.stackName}/sparebank1.no`,
				],
			}),
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			apiFeature.api,
			'sparebank1accounts',
			'Query',
			lambdas.sparebank1accounts,
			{
				read: {
					TOKENS_TABLE: this.tokensTable,
				},
			},
		)

		gqlLambda(
			this,
			stack,
			baseLayer,
			apiFeature.api,
			'sparebank1transactions',
			'Query',
			lambdas.sparebank1transactions,
			{
				read: {
					TOKENS_TABLE: this.tokensTable,
				},
			},
		)
	}
}
