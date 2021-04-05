export class InternalError extends Error {
	constructor(...params: any[]) {
		super(...params)
		this.name = 'InternalError'
		Error.captureStackTrace(this, InternalError)
		Object.setPrototypeOf(this, InternalError.prototype)
	}
}
