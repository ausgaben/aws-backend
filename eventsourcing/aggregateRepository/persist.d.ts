import { Aggregate } from './Aggregate'

export type persist<A extends Aggregate> = (aggregate: A) => Promise<void>
