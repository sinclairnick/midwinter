import { Midwinter } from "../../";
import { describe, expect, expectTypeOf, test } from "vitest";
import { init } from ".";
import { AccessControlHeader } from "./util";

describe("Cors", () => {
  const { cors } = init();

  test("Allows options object", async () => {
    const handle = new Midwinter()
      .use(cors({ allowOrigin: "http://test.com" }))
      .end(() => Response.json({ bar: true }));

    const res = await handle(new Request("http://test.com"));
    const allowOrigin = res.headers.get(AccessControlHeader.AllowOrigin);
    const body = await res.json();

    expect(allowOrigin).toBe("http://test.com");
    expect(body).toEqual({ bar: true });
  });

  test("Allows options fn", async () => {
    const handle = new Midwinter()
      .use(cors(() => ({ allowOrigin: "http://test.com" })))
      .end(() => Response.json({ bar: true }));

    const res = await handle(new Request("http://test.com"));
    const allowOrigin = res.headers.get(AccessControlHeader.AllowOrigin);
    const body = await res.json();

    expect(allowOrigin).toBe("http://test.com");
    expect(body).toEqual({ bar: true });
  });

  test("Infers correct generic parameter types", () => {
    new Midwinter()
      .use(() => ({ foo: true }))
      .use(
        cors((req, ctx) => {
          expectTypeOf<typeof ctx>().toMatchTypeOf<{ foo: boolean }>();

          return {};
        })
      );
  });
});
