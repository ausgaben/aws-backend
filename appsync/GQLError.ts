import { Context } from 'aws-lambda';
import { ConflictError } from '../errors/ConflictError';
import { EntityNotFoundError } from '../errors/EntityNotFoundError';
import { ValidationFailedError } from '../errors/ValidationFailedError';

/**
 * See $util.error(String, String, Object, Object)
 in https://docs.aws.amazon.com/appsync/latest/devguide/resolver-util-reference.html#utility-helpers-in-util
 */
export const GQLError = (context: Context, error: Error): object => {
    const errorType = error.name;
    const errorMessage = error.message;
    if (
        error instanceof ConflictError ||
        error instanceof EntityNotFoundError ||
        error instanceof ValidationFailedError
    ) {
        // Do not log
    } else {
        console.error(
            JSON.stringify({
                context,
                error,
            }),
        );
    }
    return {
        errorType,
        errorMessage,
        data: {},
        errorInfo: {
            AWSrequestID: context.awsRequestId,
        },
    };
};
