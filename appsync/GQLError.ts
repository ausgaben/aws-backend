import { Context } from 'aws-lambda';
import { ConflictError } from '../errors/ConflictError';
import { EntityNotFoundError } from '../errors/EntityNotFoundError';
import { ValidationFailedError } from '../errors/ValidationFailedError';

export const GQLError = (context: Context, error: Error) => {
    let type = 'Internal';
    const title = error.message || error.name;
    if (error instanceof ConflictError) {
        type = 'Conflict';
    } else if (error instanceof EntityNotFoundError) {
        type = 'NotFound';
    } else if (error instanceof ValidationFailedError) {
        type = 'ValidationFailed';
    } else {
        console.error(
            JSON.stringify({
                context,
                error,
            }),
        );
    }
    return {
        AWSrequestID: context.awsRequestId,
        success: false,
        error: {
            title,
            type,
        },
    };
};
