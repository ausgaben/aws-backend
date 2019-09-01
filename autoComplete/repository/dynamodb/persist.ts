import {
    DynamoDBClient,
    PutItemCommand,
} from '@aws-sdk/client-dynamodb-v2-node';
import * as AccountAutoCompleteRepository from '../persist';
import { NonEmptyString } from '../../../validation/NonEmptyString';
import { ValidationFailedError } from '../../../errors/ValidationFailedError';
import { UUIDv4 } from '../../../validation/UUIDv4';
import * as t from 'io-ts';

export const persist = (
    dynamodb: DynamoDBClient,
    TableName: string,
): AccountAutoCompleteRepository.persist => {
    TableName = NonEmptyString.decode(TableName).getOrElse(errors => {
        throw new ValidationFailedError(
            'autoComplete/repository/dynamodb/persist()',
            errors,
        );
    });
    return async (args: {
        accountId: string;
        autoCompleteStrings: { [key: string]: string[] };
    }): Promise<void> => {
        const { accountId, autoCompleteStrings } = t
            .type({
                accountId: UUIDv4,
                autoCompleteStrings: t.record(
                    t.string,
                    t.array(NonEmptyString),
                ),
            })
            .decode(args)
            .getOrElse(errors => {
                throw new ValidationFailedError(
                    'autoComplete/repository/dynamodb/persist()',
                    errors,
                );
            });

        await Promise.all(
            Object.keys(autoCompleteStrings).map(field =>
                dynamodb.send(
                    new PutItemCommand({
                        TableName,
                        Item: {
                            accountId: {
                                S: accountId,
                            },
                            autoCompleteField: {
                                S: field,
                            },
                            autoCompleteValues: {
                                ...(autoCompleteStrings[field].length && {
                                    SS: autoCompleteStrings[field],
                                }),
                                ...(!autoCompleteStrings[field].length && {
                                    NULL: true,
                                }),
                            },
                        },
                    }),
                ),
            ),
        );
    };
};
