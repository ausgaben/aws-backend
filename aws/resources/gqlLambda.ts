import { Construct, RemovalPolicy, Stack, Duration } from '@aws-cdk/core'
import { PolicyStatement } from '@aws-cdk/aws-iam'
import {
	Code,
	Function as Lambda,
	ILayerVersion,
	Runtime,
} from '@aws-cdk/aws-lambda'
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs'
import { CfnGraphQLApi } from '@aws-cdk/aws-appsync'
import { GQLLambdaResolver } from '../resources/GQLLambdaResolver'
import { Table } from '@aws-cdk/aws-dynamodb'

export const gqlLambda = (
	parent: Construct,
	stack: Stack,
	baseLayer: ILayerVersion,
	api: CfnGraphQLApi,
	field: string,
	type: 'Query' | 'Mutation',
	lambda: Code,
	dynamodb: {
		read?: Record<string, { table: Table }>
		write?: Record<string, { table: Table }>
	},
	environment?: Record<string, string>,
): Lambda => {
	const f = new Lambda(parent, `${field}${type}`, {
		handler: 'index.handler',
		runtime: Runtime.NODEJS_14_X,
		timeout: Duration.seconds(30),
		memorySize: 1792,
		initialPolicy: [
			new PolicyStatement({
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents',
				],
				resources: [
					`arn:aws:logs:${stack.region}:${stack.account}:/aws/lambda/*`,
				],
			}),
			...Object.values(dynamodb.read ?? {}).map(
				({ table }) =>
					new PolicyStatement({
						actions: [
							'dynamodb:Query',
							'dynamodb:GetItem',
							'dynamodb:BatchGetItem',
						],
						resources: [table.tableArn, `${table.tableArn}/*`],
					}),
			),
			...Object.values(dynamodb.write ?? {}).map(
				({ table }) =>
					new PolicyStatement({
						actions: ['dynamodb:PutItem'],
						resources: [table.tableArn],
					}),
			),
		],
		environment: {
			...environment,
			...[
				...Object.entries(dynamodb?.read ?? {}),
				...Object.entries(dynamodb?.write ?? {}),
			].reduce(
				(env, [k, { table }]) => ({ ...env, [k]: table.tableName }),
				{},
			),
		},
		layers: [baseLayer],
		code: lambda,
	})

	f.node.addDependency(api)

	new LogGroup(parent, `${field}${type}LogGroup`, {
		removalPolicy: RemovalPolicy.DESTROY,
		logGroupName: `/aws/lambda/${f.functionName}`,
		retention: RetentionDays.ONE_WEEK,
	})

	new GQLLambdaResolver(parent, api, field, type, f)

	return f
}
