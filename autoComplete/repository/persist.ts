export type persist = (args: {
	accountId: string
	autoCompleteStrings: { [key: string]: string[] }
}) => Promise<void>
