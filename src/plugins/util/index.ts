import { Midwinter } from "midwinter";
import { AnyMeta } from "@/types/util";

export type TypeKey<T extends string> = `~T${T}`;
export type StripTypeKey<T extends string> = T extends `~T${infer $Inner}`
  ? $Inner
  : T;

export type TypeOf<T = unknown> = { __typeof: T };
export type InferTypeof<T = unknown, Default = never> = T extends TypeOf<any>
  ? T["__typeof"]
  : Default;

export type Typify<T extends AnyMeta> = {
  [Key in keyof T & string as TypeKey<Key>]: TypeOf<T[Key]>;
};
export type UnTypify<T extends AnyMeta> = {
  [Key in keyof T as StripTypeKey<Key & string>]: T[Key] extends TypeOf
    ? T[Key]["__typeof"]
    : T[Key];
};

/** Append types to the meta object */
export const types = <T extends AnyMeta>(input?: T) => {
  return new Midwinter<{}, Typify<T>>();
};
