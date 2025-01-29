import { OutputHandler, ValidOpts } from "./types";
import { makeParseFn } from "./parsing";
import { parse } from "schema-shift";
import { Midwinter, AnyCtx, AnyMeta, EndMiddlewareHandler } from "midwinter";

export type * from "./types";
export type * from "./parsing";

export const init = () => {
  /**
   * Add synchronous parsing and validation, resulting in the
   * query, params, body and headers being added to the ctx.
   */
  const valid = <T extends ValidOpts>(opts: T) => {
    return new Midwinter(opts).use(async (req, _, meta) => {
      const parse = makeParseFn(req, {
        ...opts,
        path: meta.path ? String(meta.path) : undefined,
      });

      return { ...(await parse()) };
    });
  };

  /** Add lazy validation that can be triggered via the `ctx.parse()` function */
  const validLazy = <T extends ValidOpts>(opts: T) => {
    return new Midwinter(opts).use((req, _, meta) => {
      return {
        parse: makeParseFn(req, {
          ...opts,
          path: meta.path ? String(meta.path) : undefined,
        }),
      };
    });
  };

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
