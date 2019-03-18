import { Context } from 'aws-lambda';
import { GQLError } from '../GQLError';
import { ConflictError } from '../../errors/ConflictError';

export const handler = async (
    event: {
        cognitoIdentityId: string;
    },
    context: Context,
) => {
    try {
        console.log(`Find accounts for ${event.cognitoIdentityId}`);
        throw new ConflictError(`No accounts!`);
        return {
            data: {
                items: [],
            },
        };
    } catch (error) {
        return GQLError(context, error);
    }
};
