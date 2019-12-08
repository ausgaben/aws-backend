import * as t from 'io-ts'

const isCognitoUserId = (u: unknown): u is string =>
	typeof u === 'string' &&
	/^[a-z]{2}-[a-z]+-[0-9]:[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}$/i.test(
		u,
	)

export const CognitoUserId = new t.Type<string, string, unknown>(
	'CognitoUserId',
	isCognitoUserId,
	(u, c) => (isCognitoUserId(u) ? t.success(u) : t.failure(u, c)),
	t.identity,
)
