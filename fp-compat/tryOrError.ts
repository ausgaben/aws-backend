import { tryCatch } from 'fp-ts/lib/TaskEither'

/**
 * @deprecated Convert fn to return Either
 */
export const tryOrError = async <A>(fn: () => Promise<A>) =>
	tryCatch<Error, A>(fn, reason => reason as Error)()
