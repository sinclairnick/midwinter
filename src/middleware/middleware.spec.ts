import { describe, expectTypeOf, test } from "vitest";
import { Middleware } from "./types";
import { InferMiddlewareCtxUpdate, InferMiddlewareReturn } from "@/middleware/infer";

describe("Types", () => {
  test("Allows empty fns", () => {
    const middleware = (() => {
      return;
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Disallows array return", () => {
    const middleware = (() => {
      return [];
      // @ts-expect-error
    }) satisfies Middleware;

    expectTypeOf(middleware).not.toMatchTypeOf<Middleware>();
  });

  test("Disallows primitive return", () => {
    const middleware = (() => {
      return 1;
      // @ts-expect-error
    }) satisfies Middleware;

    expectTypeOf(middleware).not.toMatchTypeOf<Middleware>();
  });

  test("Disallows random first param", () => {
    const middleware = ((a: number) => {
      return;
      // @ts-expect-error
    }) satisfies Middleware;

    expectTypeOf(middleware).not.toMatchTypeOf<Middleware>();
  });

  test("Allows 1 rest", () => {
    const middleware = ((req: Request, rest1) => {
      return;
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Allows n rest", () => {
    const middleware = ((req: Request, rest1, rest2) => {
      return;
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Allows return value object", () => {
    const middleware = ((req: Request, rest1, rest2) => {
      return {};
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Disallows return value as arbitary fn", () => {
    // @ts-expect-error
    const middleware = ((opt1) => (req: Request, rest1, rest2) => {
      return (a: number, b: number) => {};
    }) satisfies Middleware;

    expectTypeOf(middleware).not.toMatchTypeOf<Middleware>();
  });

  test("Allows return response handler", () => {
    const middleware = ((req: Request, rest1, rest2) => {
      return (response) => new Response();
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Disllows return response handler with random first param", () => {
    // @ts-expect-error
    const middleware = ((req: Request) => {
      return (response: number) => new Response();
    }) satisfies Middleware;

    expectTypeOf(middleware).not.toMatchTypeOf<Middleware>();
  });

  test("Allows sync req handler", () => {
    const middleware = ((req: Request) => {
      return (response: Response) => new Response();
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });
  test("Allows async req handler", () => {
    const middleware = (async (req: Request) => {
      return (response: Response) => new Response();
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Allows async res handler", () => {
    const middleware = ((req: Request) => {
      return async () => new Response();
    }) satisfies Middleware;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Handles explicit types with return", () => {
    const middleware = ((req: Request) => {
      return { foo: "bar" };
    }) satisfies Middleware<{ foo: "bar" }>;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Handles explicit types with no return", () => {
    const middleware = ((req: Request) => {
      return;
    }) satisfies Middleware<{ foo: "bar" }>;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  test("Handles explicit types with partial return", () => {
    const middleware = ((req: Request) => {
      return { foo: "bar" };
    }) satisfies Middleware<{ foo: "bar"; baz?: boolean }>;

    expectTypeOf(middleware).toMatchTypeOf<Middleware>();
  });

  describe("Inference", () => {
    test("Infers return type: update with implicit return", () => {
      const middleware = ((req: Request) => {
        return { foo: "bar" };
      }) satisfies Middleware;

      type Return = InferMiddlewareReturn<typeof middleware>;

      expectTypeOf<Return>().toMatchTypeOf<{ foo: string }>();
    });

    test("Infers return type: update with explicit return", () => {
      const middleware = ((req: Request) => {
        return { foo: "bar" };
      }) satisfies Middleware<{ foo: "bar" }>;

      type Return = InferMiddlewareReturn<typeof middleware>;

      expectTypeOf<Return>().toMatchTypeOf<{ foo: "bar" }>();
    });

    test("Infers return type: response handler", () => {
      const middleware = ((req: Request) => {
        return () => {};
      }) satisfies Middleware<{ foo: "bar" }>;

      type Return = InferMiddlewareReturn<typeof middleware>;

      expectTypeOf<Return>().toMatchTypeOf<() => void>();
    });

    test("Infers ctx update type, when present", () => {
      const middleware = ((req: Request) => {
        return { foo: "bar" };
      }) satisfies Middleware;

      type Return = InferMiddlewareCtxUpdate<typeof middleware>;

      expectTypeOf<Return>().toMatchTypeOf<{ foo: string }>();
    });

    test("Infers ctx update type, when absent", () => {
      const middleware = ((req: Request) => {
        return;
      }) satisfies Middleware;

      type Return = InferMiddlewareCtxUpdate<typeof middleware>;

      expectTypeOf<Return>().toMatchTypeOf<void>();
    });

    test("Infers ctx update type, when union return", () => {
      const middleware = ((req: Request) => {
        if (Math.random()) {
          return { foo: true };
        }

        return Response.json({});
      }) satisfies Middleware;

      type Return = InferMiddlewareCtxUpdate<typeof middleware>;

      expectTypeOf<Return>().toMatchTypeOf<{ foo: boolean }>();
    });
  });
});
