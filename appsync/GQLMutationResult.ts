import { Context } from 'aws-lambda';

export const GQLMutationResult = (context: Context) => ({
    AWSrequestID: context.awsRequestId,
    success: true,
});
