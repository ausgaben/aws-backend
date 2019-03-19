export type PaginatedResult<A extends Aggregate> = {
    items: A[];
    nextStartKey?: string;
};
