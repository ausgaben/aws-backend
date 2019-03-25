import * as t from 'io-ts';

interface NonZeroIntegerBrand {
    readonly NonZeroInteger: unique symbol;
}

export const NonZeroInteger = t.brand(
    t.number,
    (n): n is t.Branded<number, NonZeroIntegerBrand> =>
        Number.isInteger(n) && n !== 0,
    'NonZeroInteger',
);
