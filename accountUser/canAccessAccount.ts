import * as t from 'io-ts';
import * as AccountUserRepository from './repository/findByUserId';
import { AccessDeniedError } from '../errors/AccessDeniedError';
import { UUIDv4 } from '../validation/UUIDv4';
import { CognitoUserId } from '../validation/CognitoUserId';
import { ValidationFailedError } from '../errors/ValidationFailedError';
import { getOrElseL } from '../fp-compat/getOrElseL';

export const canAccessAccount = (
    findAccountUserByUserId: AccountUserRepository.findByUserId,
) => async (args: { accountId: string; userId: string }): Promise<void> => {
    const { accountId, userId } = getOrElseL(
        t
            .type({
                accountId: UUIDv4,
                userId: CognitoUserId,
            })
            .decode(args),
    )(errors => {
        throw new ValidationFailedError('canAccessAccount()', errors);
    });

    const userAccounts = await findAccountUserByUserId(userId);
    const accountUser = userAccounts.items.find(
        ({ accountId: a }) => a === accountId,
    );
    if (!accountUser) {
        throw new AccessDeniedError(
            `User "${userId}" is not allowed to access account "${accountId}"!`,
        );
    }
};
