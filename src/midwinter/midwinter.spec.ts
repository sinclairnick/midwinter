import { describe, expect, expectTypeOf, test } from "vitest";
import { Midwinter } from "./midwinter";
import { AnyMeta } from "@/types/util";
import { InferCtx, InferMeta } from "./infer";

const createReq = () => new Request("https://test.com");

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

    test.only("Works with mutations", async () => {
      const mid = new Midwinter().use((req, ctx) => {
        return { foo: true };
      });

      const middleware = mid.use<{ mut: boolean }>((req, ctx) => {
        ctx.mut = true;
      });

      const handle = middleware.end((r, c) => Response.json(c));

      expectTypeOf<InferCtx<typeof middleware>>().toEqualTypeOf<{
        mut: boolean;
        foo: boolean;
      }>();

      await expect(handle(createReq()).then((x) => x.json())).resolves.toEqual({
        foo: true,
        mut: true,
      });
    });

    test("Supports a high number of chains, TS-wise", () => {
      const mid = new Midwinter();

      const myMid = mid.use(() => {
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
      const app1 = new Midwinter({ a: 1 }).use(() => {
        return { foo: true };
      });
      const app2 = new Midwinter({ b: 2 }).use(() => {
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

      await expect(handle(createReq()).then((x) => x.json())).resolves.toEqual({
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

      await expect(handle(createReq())).resolves.toBeInstanceOf(Response);
    });

    test("Allows void return", () => {
      const mid = new Midwinter();

      const middleware = mid.use((req, ctx) => {
        return;
      });
    });

    test("Allows partial ctx specification", () => {
      const mid = new Midwinter<{ foo: boolean; bar: boolean }>();

      const middleware = mid.use((req, ctx: { foo: boolean }) => {
        //
      });

      const middleware2 = mid.use(middleware);

      expectTypeOf<InferCtx<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
      }>();

      expectTypeOf<InferCtx<typeof middleware2>>().toMatchTypeOf<{
        foo: boolean;
        bar: boolean;
      }>();
    });

    test("Uses unknown types, known keys, for meta param", () => {
      const mid = new Midwinter({
        foo: true,
      });

      const middleware = mid.use(() => {});

      const middleware2 = mid.use(middleware).use((_, __, meta) => {
        expectTypeOf<(typeof meta)["foo"]>().toEqualTypeOf<unknown>();
      });
    });

    test("Infers ctx update", () => {
      const mid = new Midwinter();

      const middleware = mid.use((req, ctx) => {
        return { bar: 1 };
      });

      expectTypeOf<InferCtx<typeof middleware>>().toMatchTypeOf<{
        bar: number;
      }>();
    });

    test("Infers optional ctx update correctly (as partial)", () => {
      const mid = new Midwinter();

      const middleware = mid.use((req, ctx) => {
        if (Math.random()) {
          return { bar: 1 };
        }
      });

      expectTypeOf<InferCtx<typeof middleware>>().toMatchTypeOf<{
        bar?: number;
      }>();
    });

    test("Uses initial ctx", () => {
      type Initial = {
        foo: boolean;
      };
      const mid = new Midwinter<Initial>();

      const middleware = mid.use((req, ctx) => {
        return { bar: 1 };
      });

      expectTypeOf<InferCtx<typeof middleware>>().toMatchTypeOf<{
        foo: boolean;
      }>();
    });

    test("Defines fn + meta", () => {
      const mid = new Midwinter({
        hasMeta: true,
      });

      const middleware = mid.use((req, ctx) => {
        return { bar: 1 };
      });

      expectTypeOf<InferMeta<typeof middleware>>().toMatchTypeOf<{
        hasMeta: boolean;
      }>();

      const handle = middleware.end();
      expect(handle.meta).toBeDefined();
      expect(handle.meta.hasMeta).toBeDefined();
      expect(handle.meta.hasMeta).toBeTruthy();
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
      await expect(handle(createReq())).resolves.toBeInstanceOf(Response);
    });

    test("Allows handler", async () => {
      const app = new Midwinter();

      const handle = app.end(() => Response.json({}));

      expectTypeOf<ReturnType<typeof handle>>().toEqualTypeOf<
        Promise<Response>
      >();
      await expect(handle(createReq())).resolves.toBeInstanceOf(Response);
    });
  });
});
