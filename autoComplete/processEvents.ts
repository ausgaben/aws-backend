import { SpendingCreatedEvent } from '../events/SpendingCreated';
import { findByAccountId } from './repository/findByAccountId';
import { persist } from './repository/persist';
import {
    SpendingDeletedEvent,
    SpendingDeletedEventName,
} from '../events/SpendingDeleted';

/**
 * Process the grouped events for an aggregate
 */
export const processEvents = async (
    events: {
        [accountId: string]: (SpendingCreatedEvent | SpendingDeletedEvent)[];
    },
    findByAccountId: findByAccountId,
    persist: persist,
): Promise<void> => {
    await Promise.all(
        Object.keys(events).map(async accountId => {
            const autoCompleteStrings = await findByAccountId({ accountId });

            // Incorporate new entries
            events[accountId].forEach(event => {
                if (event.eventName === SpendingDeletedEventName) {
                    return;
                }
                ['category', 'paidWith'].forEach(field => {
                    const v = ((<SpendingCreatedEvent>event)
                        .eventPayload as any)[field];
                    autoCompleteStrings[field] = [
                        ...new Set([
                            ...(autoCompleteStrings[field] || []),
                            ...(v ? [v] : []),
                        ]),
                    ];
                    autoCompleteStrings[field].sort();
                });
                const categoryDescriptions = `category:${
                    ((<SpendingCreatedEvent>event).eventPayload as any).category
                }`;
                autoCompleteStrings[categoryDescriptions] = [
                    ...new Set([
                        ...(autoCompleteStrings[categoryDescriptions] || []),
                        ((<SpendingCreatedEvent>event).eventPayload as any)
                            .description,
                    ]),
                ];
                autoCompleteStrings[categoryDescriptions].sort();
            });

            return persist({ accountId, autoCompleteStrings });
        }),
    );
};
