import { PaginatedResult } from '../../eventsourcing/aggregateRepository/PaginatedResult';
import { Spending } from '../Spending';

export type findByAccountId = (
    accountId: string,
    startKey?: any,
) => Promise<PaginatedResult<Spending>>;
