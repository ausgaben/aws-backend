import { PaginatedResult } from '../../eventsourcing/aggregateRepository/PaginatedResult'
import { Spending } from '../Spending'

export type findByAccountId = (args: {
	startDate: Date
	endDate: Date
	accountId: string
	startKey?: any
}) => Promise<PaginatedResult<Spending>>
