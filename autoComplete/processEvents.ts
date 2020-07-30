import { SpendingCreatedEvent } from '../events/SpendingCreated'
import { findByAccountId as findByAccountIdFn } from './repository/findByAccountId'
import { persist as persistFn } from './repository/persist'
import {
	SpendingDeletedEvent,
	SpendingDeletedEventName,
} from '../events/SpendingDeleted'

/**
 * Process the grouped events for an aggregate
 */
export const processEvents = async (
	events: {
		[accountId: string]: (SpendingCreatedEvent | SpendingDeletedEvent)[]
	},
	findByAccountId: findByAccountIdFn,
	persist: persistFn,
): Promise<void> => {
	await Promise.all(
		Object.keys(events).map(async (accountId) => {
			const autoCompleteStrings = await findByAccountId({ accountId })

			// Incorporate new entries
			events[accountId].forEach((event) => {
				if (event.eventName === SpendingDeletedEventName) {
					return
				}
				const props = ['category']
				props.forEach((field) => {
					const v = ((event as SpendingCreatedEvent)
						.eventPayload as any)[field]
					autoCompleteStrings[field] = [
						...new Set([
							...(autoCompleteStrings[field] !== undefined
								? autoCompleteStrings[field].map((s) =>
										s.trim(),
								  )
								: []),
							...(v !== undefined ? [v.trim()] : []),
						]),
					]
					autoCompleteStrings[field].sort((a, b) =>
						a.localeCompare(b),
					)
				})
				const categoryDescriptions = `category:${
					((event as SpendingCreatedEvent).eventPayload as any)
						.category
				}`
				autoCompleteStrings[categoryDescriptions] = [
					...new Set([
						...(autoCompleteStrings[categoryDescriptions] !==
						undefined
							? autoCompleteStrings[
									categoryDescriptions
							  ].map((s) => s.trim())
							: []),
						((event as SpendingCreatedEvent)
							.eventPayload as any).description.trim(),
					]),
				]
				autoCompleteStrings[categoryDescriptions].sort((a, b) =>
					a.localeCompare(b),
				)
			})

			return persist({ accountId, autoCompleteStrings })
		}),
	)
}
