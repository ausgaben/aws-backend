import {
	AttributeValue,
	_UnmarshalledAttributeValue,
} from '@aws-sdk/client-dynamodb'

export type DynamoDBItemWithRemovableProperties = {
	[key: string]: AttributeValue | { remove: true }
}

export type DynamoDBItem = {
	[key: string]: _UnmarshalledAttributeValue
}
