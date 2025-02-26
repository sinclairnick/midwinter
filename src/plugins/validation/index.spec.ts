import { describe, expect, expectTypeOf, test } from "vitest";
import { z, ZodError } from "zod";
import { init } from ".";
import { InferCtx, InferMeta } from "../../midwinter/infer";
import { Midwinter } from "midwinter";
import { TypeOf } from "../util";

describe("valid", () => {
  const mid = new Midwinter();

  const { valid, output } = init();

  describe("Types", () => {
    test("Initially has no type info", () => {
      const middleware = mid.use(valid({}));

      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toEqualTypeOf<{}>();
    });

    test("Initially uses default schema info", () => {
      const middleware = mid.use(valid({}));

      type Ctx = InferCtx<typeof middleware>;

      expectTypeOf<Ctx>().toMatchTypeOf<{
        params: Record<string, string | undefined>;
        query: Record<string, string | undefined>;
        body: unknown;
        headers: Record<string, string | undefined>;
      }>();
    });

    test("Adds query to meta and ctx", () => {
      const Query = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Query }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta["Query"]>().toMatchTypeOf<typeof Query>();
      expectTypeOf<Ctx["query"]>().toMatchTypeOf<{ foo: boolean }>();
      expectTypeOf<Meta["~TQuery_In"]>().toMatchTypeOf<
        TypeOf<{ foo: boolean }>
      >();
    });

    test("Adds params to meta and ctx", () => {
      const Params = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Params }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Params: typeof Params;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        params: { foo: boolean };
      }>();
    });

    test("Adds body to meta and ctx", () => {
      const Body = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Body }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Body: typeof Body;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        body: { foo: boolean };
      }>();
    });

    test("Adds headers to meta and ctx", () => {
      const Headers = z.object({ foo: z.boolean() });
      const middleware = mid.use(valid({ Headers }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Headers: typeof Headers;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        headers: { foo: boolean };
      }>();
    });

    test("Retains existing ctx", () => {
      const Headers = z.object({ foo: z.boolean() });
      const middleware = mid
        .use(() => ({ foo: "bar" }))
        .use(valid({ Headers }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Headers: typeof Headers;
      }>();

      expectTypeOf<Ctx>().toMatchTypeOf<{
        headers: { foo: boolean };
        foo: string;
      }>();
    });

    test("Parts work with type only", () => {
      const middleware = new Midwinter().use(
        valid<{
          Query: { foo: boolean };
          Params: { bar: boolean };
          Output: { baz: boolean };
        }>()
      );

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<keyof Ctx>().toMatchTypeOf<
        "query" | "params" | "body" | "headers"
      >();
      expectTypeOf<Ctx["query"]>().toMatchTypeOf<{ foo: boolean }>();
      expectTypeOf<Ctx["params"]>().toMatchTypeOf<{ bar: boolean }>();
      expectTypeOf<keyof Meta>().toMatchTypeOf<
        | "~TQuery_In"
        | "~TQuery_Out"
        | "~TParams_Out"
        | "~TParams_In"
        | "~TOutput_Out"
        | "~TOutput_In"
      >();
      expectTypeOf<Meta["~TQuery_In"]>().toMatchTypeOf<
        TypeOf<{ foo: boolean }>
      >();
      expectTypeOf<Meta["~TQuery_Out"]>().toMatchTypeOf<
        TypeOf<{ foo: boolean }>
      >();
      expectTypeOf<Meta["~TParams_In"]>().toMatchTypeOf<
        TypeOf<{ bar: boolean }>
      >();
    });

    test.todo("Output type is enforced when pre-specified", () => {
      const middleware = new Midwinter()
        .use(valid<{ Output: { foo: boolean } }>())
        .end(
          // @ts-expect-error
          output((req) => {
            return { foo: 1 };
          })
        );
    });

    test("Output type is inferred when Output type absent", () => {
      const middleware = new Midwinter().end(
        output((req, ctx) => {
          return { foo: 1 };
        })
      );

      type Meta = typeof middleware.meta;

      expectTypeOf<Meta["~TOutput_In"]>().toMatchTypeOf<
        TypeOf<{ foo: number }>
      >();
    });

    test("Types can overlay", () => {
      // TODO:
      const middleware = new Midwinter()
        .use(valid({ Query: z.object({ foo: z.boolean() }) }))
        .use(valid<{ Output: { foo: number } }>());

      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta["~TQuery_In"]>().toEqualTypeOf<
        TypeOf<{ foo: boolean }>
      >;
      expectTypeOf<Meta["~TOutput_In"]>().toEqualTypeOf<
        TypeOf<{ foo: number }>
      >;
    });
  });

  describe("Runtime", () => {
    const WithId = z.object({ id: z.string() });
    const url = "https://test.com";

    test("Query: throws on invalid", async () => {
      const fetch = mid.use(valid({ Query: WithId })).end((req, { query }) => {
        return Response.json({});
      });

      await expect(() => fetch(new Request(url))).rejects.toThrowError(
        ZodError
      );
    });

    test("Query: OK on valid", async () => {
      const fetch = mid.use(valid({ Query: WithId })).end((req, { query }) => {
        return Response.json({});
      });

      await expect(fetch(new Request(url + "?id=123"))).resolves.toBeInstanceOf(
        Response
      );
    });

    test("Parses params", async () => {
      const fetch = mid
        .use(new Midwinter({ path: "/foo/:id" as const }))
        .use(valid({ Params: WithId }))
        .end((req, { params }) => {
          return Response.json(params);
        });

      const response = await fetch(new Request(url + "/foo/123"));
      const data = await response.json();

      expect(data).toEqual({ id: "123" });
    });

    test("Output: throws on invalid", async () => {
      const fetch = mid.use(valid({ Output: WithId })).end(
        output((req, ctx, meta) => {
          return { id: 23 } as any;
        })
      );

      await expect(() => fetch(new Request(url))).rejects.toThrowError(
        ZodError
      );
    });

    test("Output: throws on invalid", async () => {
      const fetch = mid
        .use(
          valid({
            Output: z.object({
              id: z.number().transform(String),
            }),
          })
        )
        .end(
          output((req, ctx, meta) => {
            return { id: 23 } as any;
          })
        );

      const res = await fetch(new Request(url));
      const body = await res.json();

      expect(body.id).toBe("23");
    });
  });

  // TODO: Output
});

describe("validLazy", () => {
  const mid = new Midwinter();

  const { validLazy } = init();

  describe("Types", () => {
    test("Initially has no type info", () => {
      const middleware = mid.use(validLazy({}));

      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toEqualTypeOf<{}>();
    });

    test("Initially uses default schema info", () => {
      const middleware = mid.use(validLazy({}));

      type Ctx = InferCtx<typeof middleware>;

      expectTypeOf<Awaited<ReturnType<Ctx["parse"]>>>().toMatchTypeOf<{
        query: Record<string, string | undefined>;
        params: Record<string, string | undefined>;
        body: unknown;
        headers: Record<string, string | undefined>;
      }>();
    });

    test("Adds query to meta and ctx", () => {
      const Query = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Query }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Query: typeof Query;
      }>();

      expectTypeOf<Awaited<ReturnType<Ctx["parse"]>>>().toMatchTypeOf<{
        query: { foo: boolean };
      }>();
    });

    test("Adds params to meta and ctx", () => {
      const Params = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Params }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Params: typeof Params;
      }>();

      expectTypeOf<Awaited<ReturnType<Ctx["parse"]>>>().toMatchTypeOf<{
        params: { foo: boolean };
      }>();
    });

    test("Adds body to meta and ctx", () => {
      const Body = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Body }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Body: typeof Body;
      }>();

      expectTypeOf<Awaited<ReturnType<Ctx["parse"]>>>().toMatchTypeOf<{
        body: { foo: boolean };
      }>();
    });

    test("Adds headers to meta and ctx", () => {
      const Headers = z.object({ foo: z.boolean() });
      const middleware = mid.use(validLazy({ Headers }));

      type Ctx = InferCtx<typeof middleware>;
      type Meta = InferMeta<typeof middleware>;

      expectTypeOf<Meta>().toMatchTypeOf<{
        Headers: typeof Headers;
      }>();

      expectTypeOf<Awaited<ReturnType<Ctx["parse"]>>>().toMatchTypeOf<{
        headers: { foo: boolean };
      }>();
    });
  });

  // TODO: Runtime parsing

  // TODO: Output
});
