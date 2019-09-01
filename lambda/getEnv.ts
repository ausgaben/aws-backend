import { isLeft } from 'fp-ts/lib/Either';
import { NonEmptyString } from '../validation/NonEmptyString';
import { EnvironmentError } from '../errors/EnvironmentError';

export const getEnv = (environment: NodeJS.ProcessEnv) => (key: string): string => {
    const r = NonEmptyString.decode(environment[key]);
    if (isLeft(r)) {
        throw new EnvironmentError(key);
    }
    return r.right;
};
