declare const __brand: unique symbol;
type Brand<B> = { readonly [__brand]: B };

export type Branded<T, B> = T & Brand<B>;

export const brand = <T>(value: unknown): T => value as T;
