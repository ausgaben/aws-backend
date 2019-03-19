import { Aggregate } from './Aggregate';

export type removeD<A extends Aggregate> = (aggregate: A) => Promise<void>;
