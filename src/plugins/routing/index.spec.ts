import { Midwinter } from "../../";
import { describe, expectTypeOf, test } from "vitest";
import * as Routing from "./index";

describe("router", () => {
  test("Adds meta", () => {
    const { route } = Routing.init();

    const mid = new Midwinter()
      .use(() => ({ foo: true }))
      .use(
        route({
          path: "/hi",
          method: "get",
        })
      );

    expectTypeOf<(typeof mid)["meta"]["path"]>().toEqualTypeOf<"/hi">();
    expectTypeOf<(typeof mid)["meta"]["method"]>().toEqualTypeOf<"get">();
    expectTypeOf<(typeof mid)["meta"]["params"]>().toEqualTypeOf<never>();
  });

  test("Infers path params", () => {
    const { route } = Routing.init();

    const mid = new Midwinter()
      .use(() => ({ foo: true }))
      .use(
        route({
          path: "/foo/:user/:name/:id",
          method: "get",
        })
      );

    expectTypeOf<
      (typeof mid)["meta"]["path"]
    >().toEqualTypeOf<"/foo/:user/:name/:id">();
    expectTypeOf<(typeof mid)["meta"]["method"]>().toEqualTypeOf<"get">();
    expectTypeOf<(typeof mid)["meta"]["params"]>().toEqualTypeOf<
      "user" | "name" | "id"
    >();
  });
});
