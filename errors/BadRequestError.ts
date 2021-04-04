export class BadRequestError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'BadRequest'
		Error.captureStackTrace(this, BadRequestError)
		Object.setPrototypeOf(this, BadRequestError.prototype)
	}
}
