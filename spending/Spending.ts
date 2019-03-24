import { Aggregate } from '../eventsourcing/aggregateRepository/Aggregate';

export const SpendingAggregateName = 'Spending';

export type Spending = Aggregate & {
    accountId: string;
    bookedAt: Date;
    category: string;
    description: string;
    amount: number;
    currencyId: string;
    isIncome: boolean;
    isPending: boolean;
    paidWith?: string;
};
