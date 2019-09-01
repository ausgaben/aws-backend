import { TaskEither } from 'fp-ts/lib/TaskEither';

export type findByAccountId = (args: {
    accountId: string;
}) => TaskEither<
    Error,
    {
        [field: string]: string[];
    }
>;
