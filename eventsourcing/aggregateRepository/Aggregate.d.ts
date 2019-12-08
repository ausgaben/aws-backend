export type AggregateMeta = {
	name: string
	id: string
	version: number
	createdAt: Date
	updatedAt?: Date
	deletedAt?: Date
}

export type Aggregate = {
	_meta: AggregateMeta
}
