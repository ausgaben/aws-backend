export class AccessDeniedError extends Error {
    constructor(...params: any[]) {
        super(...params);
        this.name = 'AccessDenied';
        Error.captureStackTrace(this, AccessDeniedError);
        Object.setPrototypeOf(this, AccessDeniedError.prototype);
    }
}
