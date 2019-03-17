import * as t from 'io-ts';

interface NonEmptyStringBrand {
    readonly NonEmptyString: unique symbol;
}

export const NonEmptyString = t.brand(
    t.string,
    (s): s is t.Branded<string, NonEmptyStringBrand> => s.trim().length > 0,
    'NonEmptyString',
);
