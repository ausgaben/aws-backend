import { AggregateEvent, AggregateEventWithPayload } from '../AggregateEvent';
import { DynamoDBRecord } from 'aws-lambda';

/**
 * Parse the DynamoDB record into an AggregateEvent
 */
export const parseRecord = (
    record: DynamoDBRecord,
): AggregateEvent | AggregateEventWithPayload | undefined => {
    if (!record.dynamodb || !record.dynamodb.NewImage) {
        console.error(`Record is not from DynamoDB!`, record);
        return;
    }
    const newImage = record.dynamodb.NewImage;
    const {
        eventUUID: { S: eventUUID },
        aggregateName: { S: aggregateName },
        aggregateUUID: { S: aggregateUUID },
        eventName: { S: eventName },
        eventCreatedAt: { S: eventCreatedAt },
    } = newImage;

    if (
        !eventUUID ||
        !aggregateName ||
        !aggregateUUID ||
        !eventName ||
        !eventCreatedAt
    ) {
        console.error(`Record has missing properties!`, newImage);
        return;
    }

    return {
        eventUUID,
        aggregateName,
        aggregateUUID,
        eventName,
        eventCreatedAt: new Date(eventCreatedAt),
        eventPayload: newImage.eventPayload
            ? JSON.parse(newImage.eventPayload.S!)
            : undefined,
    };
};
