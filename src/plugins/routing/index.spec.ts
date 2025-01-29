import { Midwinter } from "../../";
import { describe, expectTypeOf, test } from "vitest";
import * as Routing from "./index";
import { InferMeta } from "@/midwinter/infer";

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
    expectTypeOf<keyof (typeof mid)["meta"]>().toEqualTypeOf<
      "path" | "method"
    >();
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
      ("user" | "name" | "id")[]
    >();
  });

  test("Creates a prefixed route fn", () => {
    const { prefixed } = Routing.init();

    const userRoute = prefixed("/user/:id");

    const mid = new Midwinter().use(
      userRoute({ method: "get", path: "/name/:slug" })
    );

    type Meta = InferMeta<typeof mid>;

    expectTypeOf<Meta["method"]>().toEqualTypeOf<"get">();
    expectTypeOf<Meta["path"]>().toEqualTypeOf<"/user/:id/name/:slug">();
    expectTypeOf<Meta["params"]>().toEqualTypeOf<("id" | "slug")[]>();
  });
});
