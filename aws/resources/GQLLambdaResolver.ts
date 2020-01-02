import { Construct } from '@aws-cdk/core'
import { PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import { CfnDataSource, CfnGraphQLApi, CfnResolver } from '@aws-cdk/aws-appsync'
import { Function } from '@aws-cdk/aws-lambda'

export class GQLLambdaResolver extends Construct {
	public readonly dataSource: CfnDataSource

	constructor(
		parent: Construct,
		graphqlApi: CfnGraphQLApi,
		field: string,
		type: 'Mutation' | 'Query',
		lambda: Function,
	) {
		super(parent, `${field}${type}Resolver`)

		const apiRole = new Role(this, 'Role', {
			assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
		})
		apiRole.addToPolicy(
			new PolicyStatement({
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents',
				],
				resources: [`arn:aws:logs:*:*:/aws/lambda/*`],
			}),
		)
		apiRole.addToPolicy(
			new PolicyStatement({
				actions: ['lambda:InvokeFunction'],
				resources: [lambda.functionArn],
			}),
		)

		this.dataSource = new CfnDataSource(this, 'DataSource', {
			apiId: graphqlApi.attrApiId,
			name: `${field}${type}`,
			type: 'AWS_LAMBDA',
			serviceRoleArn: apiRole.roleArn,
			lambdaConfig: {
				lambdaFunctionArn: lambda.functionArn,
			},
		})

		const resolver = new CfnResolver(this, 'Resolver', {
			apiId: graphqlApi.attrApiId,
			typeName: type,
			fieldName: field,
			dataSourceName: this.dataSource.name,
			requestMappingTemplate:
				'#set($payload = {})\n' +
				'#foreach ($key in $context.arguments.keySet())\n' +
				'$util.qr($payload.put($key, $context.arguments.get($key)))\n' +
				'#end\n' +
				'$util.qr($payload.put("cognitoIdentityId", $context.identity.cognitoIdentityId))\n' +
				'{"version" : "2018-05-29",  "operation": "Invoke",  "payload": $util.toJson($payload)}',
			responseMappingTemplate:
				'#if( $context.result && $context.result.errorMessage )\n' +
				'  $utils.error($context.result.errorMessage, $context.result.errorType, $context.result.data, $context.result.errorInfo)\n' +
				'#else\n' +
				'  $utils.toJson($context.result)\n' +
				'#end',
		})

		resolver.node.addDependency(this.dataSource)
	}
}
