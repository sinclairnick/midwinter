import {
  ValidSchemaMeta,
  OutputHandler,
  ValidSchemaCtx,
  ValidTypeCtx,
  ValidSchemaOpts,
  ValidTypeOpts,
  ValidTypeMeta,
  ValidLazySchemaCtx,
  ValidLazyTypeCtx,
} from "./types";
import { makeParseFn } from "./parsing";
import { parse } from "schema-shift";
import { Midwinter, AnyCtx, AnyMeta, EndMiddlewareHandler } from "midwinter";
import { InferTypeof, TypeKey, TypeOf, Typify } from "../util";

export type * from "./types";
export type * from "./parsing";

export interface ValidPlugin {
  // VALID
  // With types only
  valid<T extends ValidTypeOpts>(): Midwinter<
    ValidTypeCtx<T>,
    ValidTypeMeta<T>
  >;
  // With schema
  valid<T extends ValidSchemaOpts>(
    opts: T
  ): Midwinter<ValidSchemaCtx<T>, ValidSchemaMeta<T>>;

  // VALIDLAZY
  // With types only
  validLazy<T extends ValidTypeOpts>(): Midwinter<
    ValidLazyTypeCtx<T>,
    ValidSchemaMeta<T>
  >;
  // With schema
  validLazy<T extends ValidSchemaOpts>(
    opts: T
  ): Midwinter<ValidLazySchemaCtx<T>, ValidSchemaMeta<T>>;

  output<
    TCtx extends AnyCtx = AnyCtx,
    TMeta extends AnyMeta = AnyMeta,
    TValue extends any = InferTypeof<TMeta[TypeKey<"Output">]>
  >(
    handler: OutputHandler<TValue, TCtx, TMeta>,
    opts?: ResponseInit
  ): EndMiddlewareHandler<TCtx, TMeta>;
}

export const init = (): ValidPlugin => {
  /**
   * Add synchronous parsing and validation, resulting in the
   * query, params, body and headers being added to the ctx.
   */
  function valid<T extends ValidSchemaOpts>(opts?: T) {
    return new Midwinter(opts as T & Typify<ValidSchemaMeta<T>>).use(
      async (req, _, meta) => {
        const parse = makeParseFn(req, {
          ...opts,
          path: meta.path ? String(meta.path) : undefined,
        });

        return { ...(await parse()) };
      }
    );
  }

  /** Add lazy validation that can be triggered via the `ctx.parse()` function */
  const validLazy = <T extends ValidSchemaOpts>(opts?: T) => {
    return new Midwinter(opts as T & Typify<ValidSchemaMeta<T>>).use(
      (req, _, meta) => {
        return {
          parse: makeParseFn(req, {
            ...opts,
            path: meta.path ? String(meta.path) : undefined,
          }),
        };
      }
    );
  };

  /**
   * Parses the response type according to the valid.Output field and packages
   * within a Response object.
   *
   * If no `Output` schema was provided, the result JSON.stringified without any validation.
   */
  const output =
    <
      TValue extends any = unknown,
      TCtx extends AnyCtx = AnyCtx,
      TMeta extends AnyMeta = AnyMeta
    >(
      handler: OutputHandler<TValue, TCtx, TMeta>,
      opts?: ResponseInit
    ): EndMiddlewareHandler<TCtx, TMeta> =>
    async (req, ctx, meta) => {
      const data = await handler(req, ctx, meta);

      if (data instanceof Response) {
        return data;
      }

      const outData = meta.Output ? await parse(meta.Output, data) : data;

      return Response.json(outData ?? null, opts);
    };

  return { valid, validLazy, output };
};
