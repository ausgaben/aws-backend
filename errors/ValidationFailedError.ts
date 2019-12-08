import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'

export class ValidationFailedError extends Error {
	readonly errors: t.Errors

	constructor(locationHint: string, errors: t.Errors) {
		super(`${failure(errors).join('\n')} at ${locationHint}`)
		this.name = 'ValidationFailed'
		this.errors = errors
		Error.captureStackTrace(this, ValidationFailedError)
		Object.setPrototypeOf(this, ValidationFailedError.prototype)
	}
}
