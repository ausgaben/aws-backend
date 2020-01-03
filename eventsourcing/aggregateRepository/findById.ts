import { Aggregate } from './Aggregate'
import { EntityNotFoundError } from '../../errors/EntityNotFoundError'
import { getById as getByIdFn } from './getById'

export type findById<A extends Aggregate> = (
	aggregateId: string,
) => Promise<A | undefined>

/**
 * @throws EntityNotFoundError if the Aggregate cannot be found.
 */
export const findById = <A extends Aggregate>(getById: getByIdFn<A>) => async (
	aggregateId: string,
): Promise<A | undefined> => {
	try {
		return await getById(aggregateId)
	} catch (error) {
		if (error instanceof EntityNotFoundError) {
			return undefined
		}
		// FIXME: Replace with Either
		throw error
	}
}
