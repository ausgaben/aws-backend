import { Construct } from '@aws-cdk/cdk';
import { ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnDataSource, CfnResolver } from '@aws-cdk/aws-appsync';
import { PolicyStatement, PolicyStatementEffect, Role } from '@aws-cdk/aws-iam';
import { Function } from '@aws-cdk/aws-lambda';
import { CfnGraphQLApi } from '@aws-cdk/aws-appsync';

export class GQLLambdaResolver extends Construct {
    constructor(
        parent: Construct,
        graphqlApi: CfnGraphQLApi,
        field: string,
        type: 'Mutation' | 'Query',
        lambda: Function,
    ) {
        super(parent, `${field}${type}Resolver`);

        const apiRole = new Role(this, 'Role', {
            assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
        });
        apiRole.addToPolicy(
            new PolicyStatement(PolicyStatementEffect.Allow)
                .addResource(`arn:aws:logs:*:*:/aws/lambda/*`)
                .addAction('logs:CreateLogGroup')
                .addAction('logs:CreateLogStream')
                .addAction('logs:PutLogEvents'),
        );
        apiRole.addToPolicy(
            new PolicyStatement(PolicyStatementEffect.Allow)
                .addResource(lambda.functionArn)
                .addAction('lambda:InvokeFunction'),
        );

        const dataSource = new CfnDataSource(this, 'DataSource', {
            apiId: graphqlApi.graphQlApiApiId,
            name: `${field}${type}`,
            type: 'AWS_LAMBDA',
            serviceRoleArn: apiRole.roleArn,
            lambdaConfig: {
                lambdaFunctionArn: lambda.functionArn,
            },
        });

        new CfnResolver(this, 'Resolver', {
            apiId: graphqlApi.graphQlApiApiId,
            typeName: type,
            fieldName: field,
            dataSourceName: dataSource.dataSourceName,
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
        });
    }
}
