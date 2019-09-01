import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb-v2-node';
import * as AccountAutoCompleteRepository from '../findByAccountId';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import { isLeft, left, right } from 'fp-ts/lib/Either';

export const findByAccountId = (
    dynamodb: DynamoDBClient,
    TableName: string,
): AccountAutoCompleteRepository.findByAccountId => (args: {
    accountId: string;
}) => async () => {
    const r = UUIDv4.decode(args.accountId);
    if (isLeft(r)) {
        return left(
            new ValidationFailedError(
                'autoComplete/repository/dynamodb/findByAccountId()',
                r.left,
            ),
        );
    }
    const accountId = r.right;

    const { Items } = await dynamodb.send(
        new QueryCommand({
            TableName,
            KeyConditionExpression: 'accountId = :accountId',
            ExpressionAttributeValues: {
                [`:accountId`]: {
                    S: accountId,
                },
            },
            ProjectionExpression: 'autoCompleteField,autoCompleteValues',
        }),
    );
    if (!Items) {
        return right({});
    }
    return right(
        Items.reduce(
            (
                autoCompleteStrings,
                { autoCompleteField, autoCompleteValues },
            ) => {
                autoCompleteStrings[
                    autoCompleteField.S!
                ] = autoCompleteValues.SS ? autoCompleteValues.SS : [];
                return autoCompleteStrings;
            },
            {} as {
                [field: string]: string[];
            },
        ),
    );
};
