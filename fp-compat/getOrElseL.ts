import { Either, isLeft, Right } from 'fp-ts/lib/Either'
import { Errors } from 'io-ts'

/**
 * @deprecated use isLeft/isRight directly
 */
export const getOrElseL = <T extends unknown>(e: Either<Errors, T>) => (
	onError: (errors: Errors) => void,
): T => {
	if (isLeft(e)) {
		onError(e.left)
	}
	return (e as Right<T>).right
}
