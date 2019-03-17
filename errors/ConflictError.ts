export class ConflictError extends Error {
    constructor(...params: any[]) {
        super(...params);
        this.name = 'Conflict';
        Error.captureStackTrace(this, ConflictError);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}
