import { _UnmarshalledAttributeValue } from '@aws-sdk/client-dynamodb'

export type DynamoDBItem = {
	[key: string]: _UnmarshalledAttributeValue
}
