import { Midwinter } from "../../";
import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";
import { InferApp } from ".";
import * as Routing from "../routing";
import * as Validation from "../validation";

describe("Client Types", () => {
  const { route } = Routing.init();
  const { valid } = Validation.init();

  test("Infers app paths", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo", method: "get" }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["GET /foo"]["Path"]>().toEqualTypeOf<"/foo">();
  });

  test("Infers method", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo", method: "get" }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["GET /foo"]["Method"]>().toEqualTypeOf<"get">();
  });

  test("Infers query types", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo", method: "get" }))
        .use(valid({ Query: z.object({ bar: z.number() }) }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["GET /foo"]["Query"]>().toEqualTypeOf<{ bar: number }>();
  });

  test("Infers implicit params types", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo/:bar", method: "get" }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["GET /foo/:bar"]["Params"]>().toEqualTypeOf<{
      bar: string;
    }>();
  });

  test("Infers explicit params types", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo/:bar", method: "get" }))
        .use(valid({ Query: z.object({ bar: z.number() }) }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["GET /foo/:bar"]["Query"]>().toEqualTypeOf<{
      bar: number;
    }>();
  });

  test("Infers body types", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo", method: "post" }))
        .use(valid({ Body: z.object({ bar: z.number() }) }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["POST /foo"]["Body"]>().toEqualTypeOf<{
      bar: number;
    }>();
  });

  test("Infers output types", () => {
    const app = {
      route: new Midwinter()
        .use(route({ path: "/foo", method: "post" }))
        .use(valid({ Output: z.object({ bar: z.number() }) }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<App["POST /foo"]["Output"]>().toEqualTypeOf<{
      bar: number;
    }>();
  });

  test("Handles multiple routes overloading path", () => {
    const app = {
      routeA: new Midwinter()
        .use(route({ path: "/foo", method: "get" }))
        .end(() => Response.json({})),
      routeB: new Midwinter()
        .use(route({ path: "/foo", method: "post" }))
        .end(() => Response.json({})),
    };
    type App = InferApp<typeof app>;

    expectTypeOf<keyof App>().toEqualTypeOf<"GET /foo" | "POST /foo">();
  });
});
