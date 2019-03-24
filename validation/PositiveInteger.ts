import * as t from 'io-ts';

interface PositiveIntegerBrand {
    readonly PositiveInteger: unique symbol;
}

export const PositiveInteger = t.brand(
    t.number,
    (n): n is t.Branded<number, PositiveIntegerBrand> => n > 0,
    'PositiveInteger',
);
