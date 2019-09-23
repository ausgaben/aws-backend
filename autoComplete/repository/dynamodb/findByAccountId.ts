import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb-v2-node';
import * as AccountAutoCompleteRepository from '../findByAccountId';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import { getOrElseL } from '../../../fp-compat/getOrElseL';

export const findByAccountId = (
    dynamodb: DynamoDBClient,
    TableName: string,
): AccountAutoCompleteRepository.findByAccountId => {
    TableName = getOrElseL(NonEmptyString.decode(TableName))(errors => {
        throw new ValidationFailedError(
            'autoComplete/repository/dynamodb/findByAccountId()',
            errors,
        );
    });
    return async (args: {
        accountId: string;
    }): Promise<{
        [field: string]: string[];
    }> => {
        const accountId = getOrElseL(UUIDv4.decode(args.accountId))(errors => {
            throw new ValidationFailedError(
                'autoComplete/repository/dynamodb/findByAccountId()',
                errors,
            );
        });

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
            return {};
        }
        return Items.reduce(
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
        );
    };
};
