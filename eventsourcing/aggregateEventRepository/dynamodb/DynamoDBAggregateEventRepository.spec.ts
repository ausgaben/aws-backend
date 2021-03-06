import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { AggregateEventWithPayload } from '../../AggregateEvent'
import { v4 } from 'uuid'
import { persist as persistDynamoDB } from './persist'
import { getByAggregateId as getByAggregateIdDynamoDB } from './getByAggregateId'
import { persist as p } from '../persist'
import { getByAggregateId as g } from '../getByAggregateId'

jest.setTimeout(60000)

const db = new DynamoDBClient({})
const TableName = process.env.AGGREGATE_EVENTS_TABLE as string

describe('DynamoDBAggregateEventRepository', () => {
	let persist: p, getByAggregateId: g

	if (process.env.AGGREGATE_EVENTS_TABLE === undefined) {
		test.only('skipped', () => {
			console.warn(
				'skipping tests (AGGREGATE_EVENTS_TABLE is not defined)',
			)
		})
	} else {
		persist = persistDynamoDB(db, TableName)
		getByAggregateId = getByAggregateIdDynamoDB(db, TableName)
	}
	test('persist()', async () => {
		const uuid = v4()
		const e: AggregateEventWithPayload = {
			eventId: v4(),
			eventName: 'foo',
			aggregateName: 'DummyEvent',
			aggregateId: uuid,
			eventPayload: { foo: ['bar'] },
			eventCreatedAt: new Date('2016-01-01T00:00:00Z'),
		}
		await persist(e)
		const events = await getByAggregateId(uuid)
		expect(events).toHaveLength(1)
		expect(events).toMatchObject([e])
	})

	test('getByAggregateId()', async () => {
		const uuid = v4()
		await Promise.all(
			[...Array(10)].map(async (_, idx) =>
				persist({
					eventId: v4(),
					eventName: `Event_${idx + 1}`,
					aggregateName: 'DummyEvent',
					aggregateId: uuid,
					eventPayload: { foo: ['bar'] },
					eventCreatedAt: new Date('2016-01-01T00:00:00Z'),
				}),
			),
		)
		const loadedEvents = await getByAggregateId(uuid)
		expect(loadedEvents).toHaveLength(10)
		expect(loadedEvents[0].eventName).toEqual('Event_1')
		expect(loadedEvents[0].eventPayload).toEqual({ foo: ['bar'] })
		expect(loadedEvents[9].eventName).toEqual('Event_10')
	})
})
