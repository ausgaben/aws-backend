import { PaginatedResult } from '../../eventsourcing/aggregateRepository/PaginatedResult';
import { AccountUser } from '../AccountUser';

export type findByUserId = (
    userId: string,
    startKey?: any,
) => Promise<PaginatedResult<AccountUser>>;
