import { Spending } from '../spending/Spending'

export type GraphQLSpending = Omit<Spending, 'bookedAt' | 'currencyId'> & {
	bookedAt: string
	currency?: Currency
}
