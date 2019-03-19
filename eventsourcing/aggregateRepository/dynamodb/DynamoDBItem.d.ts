import { _UnmarshalledAttributeValue } from '@aws-sdk/client-dynamodb-v2-node';

export type DynamoDBItem = {
    [key: string]: _UnmarshalledAttributeValue;
};
