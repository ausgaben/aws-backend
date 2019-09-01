import * as AccountUserRepository from './repository/findByUserId';
import { Task } from 'fp-ts/lib/Task';

export const canAccessAccount = (
    findAccountUserByUserId: AccountUserRepository.findByUserId,
) => (args: {
    accountId: string;
    userId: string;
}): Task<boolean> => async () => {
    const { accountId, userId } = args;
    const userAccounts = await findAccountUserByUserId(userId);
    const accountUser = userAccounts.items.find(
        ({ accountId: a }) => a === accountId,
    );
    return !!accountUser;
};
