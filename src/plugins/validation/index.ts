import { ValidOpts } from "./types";
import { makeParseFn } from "./parsing";
import z from "zod";
import { Midwinter } from "../../midwinter/midwinter";

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

  return { valid, validLazy };
};

const { valid, validLazy } = init();

const v1 = valid({
  Body: z.object({ foo: z.number() }),
});
const v2 = validLazy({
  Body: z.object({ foo: z.number() }),
});

const mid2 = mid
  .use(() => ({ user: 1 as const }))
  .use(v1)
  .use(v2)
  .use<{ userA: 1 }>((req, ctx) => {
    ctx.userA = 1;
  })
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2)
  .use(v2);
