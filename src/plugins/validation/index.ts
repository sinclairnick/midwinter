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
