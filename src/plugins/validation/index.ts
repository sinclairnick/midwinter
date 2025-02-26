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
  InferMetaOutputIn,
  ParseQueryStringFn,
} from "./types";
import { makeParseFn } from "./parsing";
import { parse } from "schema-shift";
import { Midwinter, AnyCtx, AnyMeta } from "midwinter";
import { Typify } from "../util";
import { EndMiddleware } from "@/middleware/types";

export type * from "./types";
export type * from "./parsing";

export interface ValidationOpts {
  parseQueryString?: ParseQueryStringFn;
}

export interface ValidationPlugin {
  // VALID
  // With types only
  /**
   * Add synchronous parsing and validation, resulting in the
   * query, params, body and headers being added to the ctx.
   */
  valid<T extends ValidTypeOpts = {}>(): Midwinter<
    ValidTypeCtx<T>,
    ValidTypeMeta<T>
  >;
  // With schema
  valid<T extends ValidSchemaOpts = {}>(
    opts: T
  ): Midwinter<ValidSchemaCtx<T>, ValidSchemaMeta<T>>;

  // VALIDLAZY
  // With types only
  validLazy<T extends ValidTypeOpts = {}>(): Midwinter<
    ValidLazyTypeCtx<T>,
    ValidTypeMeta<T>
  >;
  // With schema
  /** Add lazy validation that can be triggered via the `ctx.parse()` function */
  validLazy<T extends ValidSchemaOpts = {}>(
    opts: T
  ): Midwinter<ValidLazySchemaCtx<T>, ValidSchemaMeta<T>>;

  // OUTPUT

  /**
   * Parses the response type according to the valid.Output field and packages
   * within a Response object.
   *
   * If no `Output` schema was provided, the result JSON.stringified without any validation.
   */
  output<
    TCtx extends AnyCtx = AnyCtx,
    TMeta extends AnyMeta = AnyMeta,
    TValue extends InferMetaOutputIn<TMeta> = InferMetaOutputIn<TMeta>
  >(
    handler: OutputHandler<TValue, TCtx, TMeta>,
    opts?: ResponseInit
  ): EndMiddleware<
    TCtx,
    [InferMetaOutputIn<TMeta>] extends [never]
      ? {}
      : ValidTypeMeta<{ Output: TValue }>,
    TMeta
  >;
}

export const init = (opts?: ValidationOpts): ValidationPlugin => {
  const { parseQueryString } = opts ?? {};

  return {
    valid<T extends ValidSchemaOpts>(opts?: T) {
      return new Midwinter(opts as T & Typify<ValidSchemaMeta<T>>).use(
        async (req, _, meta) => {
          const parse = makeParseFn(req, {
            ...opts,
            path: meta.path ? String(meta.path) : undefined,
            parseQueryString,
          });

          return { ...(await parse()) };
        }
      );
    },
    validLazy<T extends ValidSchemaOpts>(opts?: T) {
      return new Midwinter(opts as T & Typify<ValidSchemaMeta<T>>).use(
        (req, _, meta) => {
          return {
            parse: makeParseFn(req, {
              ...opts,
              path: meta.path ? String(meta.path) : undefined,
              parseQueryString,
            }),
          };
        }
      );
    },
    // Can't be bothered fixing this
    // @ts-expect-error
    output(handler, opts) {
      return async (req, ctx, meta) => {
        const data = await handler(req, ctx, meta);

        if (data instanceof Response) {
          return data;
        }

        const outData = meta.Output ? await parse(meta.Output, data) : data;

        return Response.json(outData ?? null, opts);
      };
    },
  };
};
