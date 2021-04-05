export type Links = Record<
	string,
	{
		href: string
		method: 'GET'
	}
>

export type Sparebank1Account = {
	id: string
	accountNumber: { value: string; formatted: string }
	name: string
	description: string
	balance: { amount: number; currencyCode: 'NOK' }
	availableBalance: { amount: number; currencyCode: 'NOK' }
	owner: {
		name: string
		firstName: string
		lastName: string
	}
	product: 'LOCDEPOSIT'
	type: 'USER' | 'SAVING'
	iban: string
	_links: Links
}

export type Sparebank1Transaction = {
	amount: {
		amount: number
		currencyCode: 'NOK'
	}
	accountingDate: string // '2021-04-03'
	description?: string //'REMA BROMSTAD'
	remoteAccount?: string //"90010720965",
	transactionCode: string //'943'
	transactionType?: string // "Visa",
	_links: Links
}
