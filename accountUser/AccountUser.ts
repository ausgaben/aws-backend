import { Aggregate } from '../eventsourcing/aggregateRepository/Aggregate';

export const AccountUserAggregateName = 'AccountUser';

export type AccountUser = Aggregate & {
    accountId: string;
    userId: string;
};
