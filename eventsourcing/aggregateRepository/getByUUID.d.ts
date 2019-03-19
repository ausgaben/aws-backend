import { Aggregate } from './Aggregate';

export type getByUUID<A extends Aggregate> = (
    aggregateUUID: string,
) => Promise<A>;
