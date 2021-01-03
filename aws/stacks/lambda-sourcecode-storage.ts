import { App, CfnOutput, RemovalPolicy, Stack } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import {
	CloudFormationClient,
	DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation'

const cf = new CloudFormationClient({})

/**
 * This stack provides a bucket to store lambdas
 */
export class LambdaSourcecodeStorageStack extends Stack {
	public readonly bucket: Bucket

	constructor(parent: App, id: string) {
		super(parent, id)
		this.bucket = new Bucket(this, 'cf-sourcecode', {
			removalPolicy: RemovalPolicy.RETAIN,
		})

		new CfnOutput(this, 'bucketName', {
			value: this.bucket.bucketName,
			exportName: `${this.stackName}:bucketName`,
		})
	}

	static getBucketName = async (id: string): Promise<string> =>
		cf
			.send(new DescribeStacksCommand({ StackName: id }))
			.then(({ Stacks }) => {
				if (Stacks === undefined || !Stacks.length) {
					// FIXME: Replace with Either
					throw new Error(`${id} stack is not available.`)
				} else {
					const stack = Stacks[0]
					const BucketOutput = stack.Outputs?.find(
						({ OutputKey }) => OutputKey === 'bucketName',
					)
					if (BucketOutput?.OutputValue === undefined) {
						// FIXME: Replace with Either
						throw new Error(`${id} bucket not found.`)
					}
					return BucketOutput.OutputValue
				}
			})
}
