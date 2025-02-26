export type Awaitable<T> = Promise<T> | T;

/** Simplify ({...} & {...}) types into a unified object */
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

/**
 * Merge two objects, at a depth of 1, where keys of B take precedence over A
 */
export type MergeObjectsShallow<A, B> = Simplify<
  {
    [K in keyof A]: K extends keyof B ? B[K] : A[K];
  } & B
>;

export type UnknownValues<T> = {
  [Key in keyof T]: unknown;
};

export type DefaultTo<T, U> = [T] extends [never] ? U : T;

export type AnyCtx =
  // This value param must be unknown otherwise arbitrary functions are accepted
  Record<PropertyKey, unknown>;

export type AnyMeta =
  // This value param must be unknown otherwise arbitrary functions are accepted
  Record<PropertyKey, unknown>;

export type Strip<T, U> = {
  [Key in keyof T as [T[Key]] extends [U] ? never : Key]: T[Key];
} & {};

export type StripUnknown<T> = {
  [Key in keyof T as unknown extends T[Key] ? never : Key]: T[Key];
} & {};

export type NonReadonly<T> = {
  -readonly [Key in keyof T]: T[Key];
};

export type Map<T, From, To> = {
  [Key in keyof T]: [T[Key]] extends [From] ? To : T[Key];
} & {};
