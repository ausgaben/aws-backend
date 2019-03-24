import { Spending } from '../../Spending';
import { DynamoDBItem } from '../../../eventsourcing/aggregateRepository/dynamodb/DynamoDBItem';

export const aggregateToItem = (aggregate: Spending): DynamoDBItem => ({
    accountId: {
        S: aggregate.accountId,
    },
    bookedAt: {
        S: aggregate.bookedAt.toISOString(),
    },
    category: {
        S: aggregate.category,
    },
    description: {
        S: aggregate.description,
    },
    amount: {
        N: `${aggregate.amount}`,
    },
    currencyId: {
        S: aggregate.currencyId,
    },
    isIncome: {
        BOOL: aggregate.isIncome,
    },
    isPending: {
        BOOL: aggregate.isPending,
    },
    paidWith: aggregate.paidWith ? { S: aggregate.paidWith } : { NULL: true },
});
