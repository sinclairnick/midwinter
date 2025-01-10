import { Midwinter } from "@/midwinter/midwinter";
import { describe, test } from "vitest";
import * as Routing from "./index";

describe("router", () => {
  test("Adds meta", () => {
    const { routing } = Routing.init();

    const a = new Midwinter()
      .use(() => ({ foo: true }))
      .use(
        routing({
          path: "/hi",
          method: "get",
        })
      );
  });
});
