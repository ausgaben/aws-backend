export const NOK = {
	id: 'NOK',
	toEUR: 0.103449,

	symbol: 'kr',
}
export const EUR = {
	id: 'EUR',
	toEUR: 1,
	symbol: '€',
}
export const currencies: Currency[] = [EUR, NOK]

export type Currency = {
	id: string
	symbol: string
	toEUR: number
}
