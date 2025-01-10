import { describe, expect, expectTypeOf, test } from "vitest";
import { Midwinter } from "./midwinter";
import {
  InferMiddlewareCtxIn,
  InferMiddlewareCtxUpdate,
  InferMiddlewareMetaUpdate,
} from "@/middleware/infer";
import { MergeCtx, NextMiddlewareContext } from "@/middleware/types";
import { AnyMeta } from "@/types/util";
import { InferCtx } from "./infer";

describe("Midwinter", () => {
  describe("Use", () => {
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

    test("Disallows arbitrary ctx type", () => {
      const mid = new Midwinter<{ foo: boolean }>();

      // @ts-expect-error
      const middleware = mid.use((req, ctx: { baz: boolean }) => {});

      expectTypeOf<InferCtx<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
      }>();
    });

    test("Allows merging midwinters", async () => {
      const app1 = new Midwinter().use(() => {
        return { foo: true };
      });
      const app2 = new Midwinter().use(() => {
        return { bar: true };
      });

      const app3 = new Midwinter().use(app1).use(app2);

      const handle = app3.end((r, c) => {
        return Response.json(c);
      });

      expectTypeOf<InferCtx<typeof app3>>().toMatchTypeOf<{
        foo: boolean;
        bar: boolean;
      }>();

      await expect(
        handle(new Request("http://test.com")).then((x) => x.json())
      ).resolves.toEqual({
        foo: true,
        bar: true,
      });
    });

    test("Returns early response", async () => {
      const app = new Midwinter();

      const handle = app
        .use(() => Response.json({}))
        .end(() => {
          return Response.json({});
        });

      await expect(
        handle(new Request("http://test.com"))
      ).resolves.toBeInstanceOf(Response);
    });
  });

  describe("Define", () => {
    test("Allows void return", () => {
      const mid = new Midwinter();

      const middleware = mid.define((req, ctx) => {
        return;
      });
    });

    test("Allows partial ctx specification", () => {
      const mid = new Midwinter<{ foo: boolean; bar: boolean }>();

      const middleware = mid.define((req, ctx: { foo: boolean }) => {
        //
      });

      const middleware2 = mid.use(middleware);

      expectTypeOf<InferMiddlewareCtxIn<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
      }>();
      expectTypeOf<
        InferMiddlewareCtxIn<typeof middleware>
      >().not.toMatchTypeOf<{
        bar: boolean;
      }>();

      expectTypeOf<InferCtx<typeof middleware2>>().toMatchTypeOf<{
        foo: boolean;
        bar: boolean;
      }>();
    });

    test("Allows override ctx", () => {
      const mid = new Midwinter<{ foo: boolean }>();

      const middleware = mid.define((req, ctx: { baz: boolean }) => {
        //
      });

      expectTypeOf<InferMiddlewareCtxIn<typeof middleware>>().toMatchTypeOf<{
        baz: boolean;
      }>();
      expectTypeOf<
        InferMiddlewareCtxIn<typeof middleware>
      >().not.toMatchTypeOf<{
        bar: boolean;
      }>();
    });

    test("Uses unknown types, known keys, for meta param", () => {
      const mid = new Midwinter();

      const middleware = mid.define(() => {}, {
        foo: true,
      });

      const middleware2 = mid.use(middleware).use((_, __, meta) => {
        expectTypeOf<(typeof meta)["foo"]>().toEqualTypeOf<unknown>();
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
    test("Allows empty arg", async () => {
      const app = new Midwinter();

      const handle = app
        .use(() => {
          return Response.json({});
        })
        .end();

      expectTypeOf<ReturnType<typeof handle>>().toEqualTypeOf<
        Promise<Response | undefined>
      >();
      await expect(
        handle(new Request("http://test.com"))
      ).resolves.toBeInstanceOf(Response);
    });

    test("Allows handler", async () => {
      const app = new Midwinter();

      const handle = app.end(() => Response.json({}));

      expectTypeOf<ReturnType<typeof handle>>().toEqualTypeOf<
        Promise<Response>
      >();
      await expect(
        handle(new Request("http://test.com"))
      ).resolves.toBeInstanceOf(Response);
    });
  });
});
