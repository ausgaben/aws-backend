import * as t from 'io-ts';

const isUUIDv4 = (u: unknown): u is string =>
    typeof u === 'string' &&
    /^[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}$/i.test(
        u,
    );

export const UUIDv4 = new t.Type<string, string, unknown>(
    'UUIDv4',
    isUUIDv4,
    (u, c) => (isUUIDv4(u) ? t.success(u) : t.failure(u, c)),
    t.identity,
);
