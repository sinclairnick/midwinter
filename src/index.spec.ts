import { describe, expect, test } from "vitest";
import { Middleware } from "./middleware/types";

describe("Runtime", () => {
  test("Jwt example", () => {
    const jwtMiddleware = () =>
      ((req) => {
        const bearer = req.headers.get("authorization");
        const token = bearer?.replace("Bearer ", "");

        return { token };
      }) satisfies Middleware;

    const mid = jwtMiddleware();
    const headers = new Headers();
    headers.set("Authorization", "Bearer 1234");
    const result = mid(new Request("https://a.com", { headers }));

    expect(result).toEqual({ token: "1234" });
  });

  test("Powered by example", () => {
    const poweredBy = (opts: { name: string }) =>
      (() => {
        return (response) => {
          const headers = new Headers(response.headers);

          headers.set("X-Powered-by", opts.name);

          console.log(headers.get("X-Powered-By"));

          return new Response(response.body, {
            headers,
          });
        };
      }) satisfies Middleware;

    const mid = poweredBy({ name: "Webroute" });

    const responseHandler = mid();
    expect(responseHandler).toBeTypeOf("function");

    const result = responseHandler(new Response());

    const headers = result.headers;
    expect(headers.get("x-powered-by")).toBe("Webroute");
  });
});
