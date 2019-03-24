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
        eventId: { S: eventId },
        aggregateName: { S: aggregateName },
        aggregateId: { S: aggregateId },
        eventName: { S: eventName },
        eventCreatedAt: { S: eventCreatedAt },
    } = newImage;

    if (
        !eventId ||
        !aggregateName ||
        !aggregateId ||
        !eventName ||
        !eventCreatedAt
    ) {
        console.error(`Record has missing properties!`, newImage);
        return;
    }

    return {
        eventId,
        aggregateName,
        aggregateId,
        eventName,
        eventCreatedAt: new Date(eventCreatedAt),
        eventPayload: newImage.eventPayload
            ? JSON.parse(newImage.eventPayload.S!)
            : undefined,
    };
};
