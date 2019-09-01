export class EnvironmentError extends Error {
    constructor(variable: string) {
        super(`Environment variable ${variable} not defined!`);
        this.name = 'EnvironmentError';
        Error.captureStackTrace(this, EnvironmentError);
        Object.setPrototypeOf(this, EnvironmentError.prototype);
    }
}
