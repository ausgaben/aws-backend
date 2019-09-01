import { Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { GQLError } from '../GQLError';
import { findByUserId } from '../../accountUser/repository/dynamodb/findByUserId';
import { findByAccountId } from '../../autoComplete/repository/dynamodb/findByAccountId';
import { canAccessAccount } from '../../accountUser/canAccessAccount';
import { isLeft } from 'fp-ts/lib/Either';
import { getEnv } from '../../lambda/getEnv';
import * as t from 'io-ts';
import { UUIDv4 } from '../../validation/UUIDv4';
import { CognitoUserId } from '../../validation/CognitoUserId';
import { AccessDeniedError } from '../../errors/AccessDeniedError';
import { ValidationFailedError } from '../../errors/ValidationFailedError';

const e = getEnv(process.env);
const db = new DynamoDBClient({});
const findAccountUserByUserId = findByUserId(db, e('ACCOUNT_USERS_TABLE'));
const findAutoCompleteByAccountId = findByAccountId(
    db,
    e('ACCOUNT_AUTOCOMPLETE_TABLE'),
);

const checkAccess = canAccessAccount(findAccountUserByUserId);

export const handler = async (
    event: {
        cognitoIdentityId: string;
        accountId: string;
    },
    context: Context,
) => {
    const v = t
        .type({
            accountId: UUIDv4,
            userId: CognitoUserId,
        })
        .decode(event);

    if (isLeft(v)) {
        return GQLError(
            context,
            new ValidationFailedError('autoComplete', v.left),
        );
    }

    const r = await checkAccess({
        userId: event.cognitoIdentityId,
        accountId: event.accountId,
    })();
    if (!r) {
        return GQLError(
            context,
            new AccessDeniedError(
                `User ${event.cognitoIdentityId} is not allowed to access ${event.accountId}!`,
            ),
        );
    }

    const r2 = await findAutoCompleteByAccountId({
        accountId: event.accountId,
    })();
    if (isLeft(r2)) {
        return GQLError(context, r2.left);
    }
    const autoCompleteStrings = r2.right;
    return Object.keys(autoCompleteStrings).map(field => ({
        field,
        strings: autoCompleteStrings[field],
    }));
};
