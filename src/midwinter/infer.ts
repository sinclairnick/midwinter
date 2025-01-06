import { AnyMidwinter, Midwinter } from "./midwinter";

export type InferCtx<T extends AnyMidwinter> = T extends Midwinter<infer R, any>
  ? R
  : never;

export type InferMeta<T extends AnyMidwinter> = T extends Midwinter<
  any,
  infer R
>
  ? R
  : never;
