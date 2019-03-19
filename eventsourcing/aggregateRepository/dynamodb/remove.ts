import {
    DynamoDBClient,
    DeleteItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import * as AggregateRepository from '../remove';
import { Aggregate } from '../Aggregate';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';

export const remove = <A extends Aggregate>(
    dynamodb: DynamoDBClient,
    TableName: string,
): AggregateRepository.removeD<A> => {
    TableName = NonEmptyString.decode(TableName).getOrElseL(errors => {
        throw new ValidationFailedError(
            'aggregateRepository/dynamodb/removeD()',
            errors,
        );
    });
    return async (aggregate: A): Promise<void> => {
        await dynamodb.send(
            new DeleteItemCommand({
                TableName,
                Key: {
                    aggregateUUID: {
                        S: aggregate._meta.uuid,
                    },
                },
            }),
        );
    };
};
