import { OutputHandler, ValidOpts } from "./types";
import { makeParseFn } from "./parsing";
import { Midwinter } from "../../midwinter/midwinter";
import { parse } from "schema-shift";
import { AnyCtx, AnyMeta, EndMiddlewareHandler } from "@/index";

const mid = new Midwinter();

export const init = () => {
  /**
   * Add synchronous parsing and validation, resulting in the
   * query, params, body and headers being added to the ctx.
   */
  const valid = <T extends ValidOpts>(opts: T) => {
    return mid.define(async (req) => {
      const parse = makeParseFn(req, opts);

      return { ...(await parse()) };
    }, opts);
  };

  /** Add lazy validation that can be triggered via the `ctx.parse()` function */
  const validLazy = <T extends ValidOpts>(opts: T) => {
    return mid.define((req) => {
      return { parse: makeParseFn(req, opts) };
    }, opts);
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

      return Response.json(outData, opts);
    };

  return { valid, validLazy, output };
};
