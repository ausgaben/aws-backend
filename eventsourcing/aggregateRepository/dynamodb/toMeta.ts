import { DynamoDBItem } from './DynamoDBItem'
import { AggregateMeta } from '../Aggregate'

export const toMeta = (
	aggregateName: string,
	Item: DynamoDBItem,
): AggregateMeta => ({
	name: aggregateName,
	id: Item.aggregateId.S as string,
	createdAt: new Date(Item.createdAt.S as string),
	updatedAt: Item.updatedAt
		? new Date(Item.updatedAt.S as string)
		: undefined,
	deletedAt: Item.deletedAt
		? new Date(Item.deletedAt.S as string)
		: undefined,
	version: +(Item.version.N as string),
})
