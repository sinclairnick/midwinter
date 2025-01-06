import { describe, expect, expectTypeOf, test } from "vitest";
import { Midwinter } from "./midwinter";
import {
  InferMiddlewareCtxIn,
  InferMiddlewareCtxUpdate,
  InferMiddlewareMetaUpdate,
} from "@/middleware/infer";
import { NextMiddlewareContext } from "@/middleware/types";
import { AnyMeta } from "@/types/util";

describe("Midwinter", () => {
  describe("Use", () => {
    type InferCtx<T> = T extends Midwinter<infer C> ? C : never;

    test("Produces correct ctx type", () => {
      const mid = new Midwinter().use((req, ctx) => {
        return { foo: true };
      });

      expectTypeOf<InferCtx<typeof mid>>().toMatchTypeOf<{
        foo: boolean;
      }>();
    });

    test("Chains", () => {
      const mid = new Midwinter()
        .use((req, ctx) => {
          return { foo: true };
        })
        .use((req, ctx) => {
          return { bar: ctx.foo };
        });

      expectTypeOf<InferCtx<typeof mid>>().toMatchTypeOf<{
        foo: boolean;
        bar: boolean;
      }>();
    });

    test("Works with define", () => {
      const mid = new Midwinter().use((req, ctx) => {
        return { foo: true };
      });

      const middleware = mid.define((req, ctx) => {
        return { bar: ctx.foo };
      });

      expectTypeOf<InferMiddlewareCtxIn<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
      }>();
      expectTypeOf<
        InferMiddlewareCtxIn<typeof middleware>
      >().not.toMatchTypeOf<{
        foo: boolean;
        bar: boolean;
      }>();
      expectTypeOf<NextMiddlewareContext<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
        bar: boolean;
      }>();
    });

    test("Works with mutations", () => {
      const mid = new Midwinter().use((req, ctx) => {
        return { foo: true };
      });

      const result = mid.use<{ mut: true }>((req, ctx) => {
        ctx.mut = true;
      });
    });

    test("Supports a high number of chains, TS-wise", () => {
      const mid = new Midwinter();

      const myMid = mid.define(() => {
        return { user: true };
      });

      // n = 31
      const prev = mid
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid)
        .use(myMid);

      // Supports continuation via annotation
      const next: Midwinter<
        {
          [x: string]: unknown;
          [x: number]: unknown;
          [x: symbol]: unknown;
          user: boolean;
        },
        AnyMeta
      > = prev;

      next.use(myMid).use(myMid).use(myMid).use(myMid).use(myMid).use(myMid);
    });
  });

  describe("Define", () => {
    test("Allows void return", () => {
      const mid = new Midwinter();

      const middleware = mid.define((req, ctx) => {
        return;
      });
    });

    test("Infers ctx update", () => {
      const mid = new Midwinter();

      const middleware = mid.define((req, ctx) => {
        return { bar: 1 };
      });

      expectTypeOf<
        InferMiddlewareCtxUpdate<typeof middleware>
      >().toMatchTypeOf<{
        bar: number;
      }>();
    });

    test("Infers optional ctx update correctly (as partial)", () => {
      const mid = new Midwinter();

      const middleware = mid.define((req, ctx) => {
        if (Math.random()) {
          return { bar: 1 };
        }
      });

      expectTypeOf<InferMiddlewareCtxUpdate<typeof middleware>>().toMatchTypeOf<
        | {
            bar: number;
          }
        | undefined
      >();
      expectTypeOf<NextMiddlewareContext<typeof middleware>>().toMatchTypeOf<{
        bar?: number;
      }>();
    });

    test("Uses initial ctx", () => {
      type Initial = {
        foo: boolean;
      };
      const mid = new Midwinter<Initial>();

      const middleware = mid.define((req, ctx) => {
        return { bar: 1 };
      });

      expectTypeOf<InferMiddlewareCtxIn<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
      }>();
    });

    test("Defines fn + meta", () => {
      const mid = new Midwinter();

      const middleware = mid.define(
        (req, ctx) => {
          return { bar: 1 };
        },
        {
          hasMeta: true,
        }
      );

      expectTypeOf<
        InferMiddlewareMetaUpdate<typeof middleware>
      >().toMatchTypeOf<{
        hasMeta: boolean;
      }>();
      expect(middleware.meta).toBeDefined();
      expect(middleware.meta.hasMeta).toBeDefined();
      expect(middleware.meta.hasMeta).toBeTruthy();
    });
  });

  describe("End", () => {
    test.todo("");
  });
});
