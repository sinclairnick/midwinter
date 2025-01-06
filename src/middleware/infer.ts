import { AnyMiddleware, Middleware } from "./types";

export type InferMiddlewareReturn<T extends AnyMiddleware> = Awaited<
  ReturnType<T>
>;

export type InferMiddlewareCtxIn<T extends AnyMiddleware> =
  T extends Middleware<any, infer R> ? R : never;

export type InferMiddlewareCtxUpdate<T extends AnyMiddleware> =
  T extends Middleware<infer R> ? R : never;

export type InferMiddlewareMetaIn<T extends AnyMiddleware> =
  T extends Middleware<any, any, any, infer R> ? R : never;

export type InferMiddlewareMetaUpdate<T extends AnyMiddleware> =
  T extends Middleware<any, any, infer R, any> ? R : never;
