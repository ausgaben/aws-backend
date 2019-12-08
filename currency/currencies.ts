export const NOK = {
	id: 'NOK',
	symbol: 'kr',
}
export const EUR = {
	id: 'EUR',
	symbol: '€',
}
export const currencies: Currency[] = [EUR, NOK]

export type Currency = {
	id: string
	symbol: string
}

export const findCurrencyById = (id: string) =>
	currencies.find(({ id: currencyId }) => id === currencyId)
