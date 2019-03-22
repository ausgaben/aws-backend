import { Aggregate } from './Aggregate';

export type remove<A extends Aggregate> = (aggregate: A) => Promise<void>;
