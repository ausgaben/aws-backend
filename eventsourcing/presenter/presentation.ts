import { Aggregate } from '../aggregateRepository/Aggregate';

export type AggregatePresentation = {
    aggregateUUID: string;
    type: AggregatePresentationStates;
};

export enum AggregatePresentationStates {
    Snapshot,
    Create,
    Update,
    Delete,
}

/**
 * This is used to provide a starting point for a presentation, e.g. when
 * a presentation already exists and is loaded from the collection.
 */
export type AggregateSnapshot<A extends Aggregate> = AggregatePresentation & {
    aggregate?: A;
    type: AggregatePresentationStates.Snapshot;
};

export const Snapshot = <A extends Aggregate>(
    aggregateUUID: string,
    aggregate?: A,
): AggregateSnapshot<A> => ({
    aggregateUUID,
    aggregate,
    type: AggregatePresentationStates.Snapshot,
});

/**
 * The Aggregate was created. It should be added to the collection.
 */
export type CreateAggregatePresentation<
    A extends Aggregate
> = AggregatePresentation & {
    aggregate: A;
    type: AggregatePresentationStates.Create;
};

export const Create = <A extends Aggregate>(
    aggregate: A,
): CreateAggregatePresentation<A> => ({
    aggregateUUID: aggregate.aggregateUUID,
    aggregate,
    type: AggregatePresentationStates.Create,
});

/**
 * The Aggregate was updated. The collection should be updated.
 */
export type UpdateAggregatePresentation<
    A extends Aggregate
> = AggregatePresentation & {
    aggregate: A;
    type: AggregatePresentationStates.Update;
};

/**
 * The Aggregate was deleted. It should be removed from the collection.
 */
export type DeleteAggregatePresentation = AggregatePresentation & {
    type: AggregatePresentationStates.Delete;
};
