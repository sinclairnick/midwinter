import { Midwinter } from "../../";
import { describe, expect, expectTypeOf, test } from "vitest";
import * as Routing from "./index";
import { ParsedConfig } from "./type";
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

  test("Concats prefix and path", () => {
    type Both = ParsedConfig<{ prefix: "/hello"; path: "/sailor" }>;
    type Prefix = ParsedConfig<{ prefix: "/hello" }>;
    type Path = ParsedConfig<{ path: "/sailor" }>;

    const { route } = Routing.init();

    route({ prefix: "/foo", path: "/bar" });

    const mid = new Midwinter().use(
      route({
        prefix: "/foo/:id",
        path: "/bar/:slug",
        method: "get",
      })
    );

    expectTypeOf<Both>().toEqualTypeOf<{
      prefix: "/hello";
      path: "/hello/sailor";
    }>();
    expectTypeOf<Prefix>().toEqualTypeOf<{
      prefix: "/hello";
      path: "/hello";
    }>();
    expectTypeOf<Path>().toEqualTypeOf<{
      path: "/sailor";
    }>();
    expectTypeOf<InferMeta<typeof mid>>().toEqualTypeOf<{
      prefix: "/foo/:id";
      path: "/foo/:id/bar/:slug";
      method: "get";
      params: ("id" | "slug")[];
    }>();

    const handle = mid.end();
    expectTypeOf(handle.meta.params).toEqualTypeOf<("id" | "slug")[]>();
    expect(handle.meta.params).toEqual(["id", "slug"]);
  });
});
