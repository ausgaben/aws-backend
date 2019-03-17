import { Aggregate } from './Aggregate';
import { EntityNotFoundError } from '../../errors/EntityNotFoundError';
import { getByUUID } from './getByUUID';

export type findByUUID<A extends Aggregate> = (
    aggregateUUID: string,
) => Promise<A | undefined>;

/**
 * @throws EntityNotFoundError if the Aggregate cannot be found.
 */
export const findByUUID = <A extends Aggregate>(
    getByUUID: getByUUID<A>,
) => async (aggregateUUID: string): Promise<A | undefined> => {
    try {
        return await getByUUID(aggregateUUID);
    } catch (error) {
        if (error instanceof EntityNotFoundError) {
            return undefined;
        }
        throw error;
    }
};
