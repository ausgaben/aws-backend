export type AggregateMeta = {
    name: string;
    uuid: string;
    version: number;
    createdAt: Date;
    updatedAt?: Date;
    deletedAt?: Date;
};

export type Aggregate = {
    _meta: AggregateMeta;
    [key: string]: any;
};
