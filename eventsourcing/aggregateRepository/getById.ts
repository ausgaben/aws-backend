import { Aggregate } from './Aggregate'

export type getById<A extends Aggregate> = (aggregateId: string) => Promise<A>
