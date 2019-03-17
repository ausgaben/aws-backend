export class EntityNotFoundError extends Error {
    constructor(...params: any[]) {
        super(...params);
        this.name = 'EntityNotFound';
        Error.captureStackTrace(this, EntityNotFoundError);
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
    }
}
