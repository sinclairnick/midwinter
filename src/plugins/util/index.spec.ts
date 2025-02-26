import { describe, expectTypeOf, test } from "vitest";
import { TypeOf, types } from ".";
import { Midwinter } from "midwinter";
import { InferMeta } from "../../midwinter/infer";

describe("Util", () => {
  describe("Types", () => {
    test("Adds types", () => {
      const handle = new Midwinter().use(
        types<{
          Query: { foo: boolean };
          Body: { bar: string };
        }>()
      );

      type Meta = InferMeta<typeof handle>;

      expectTypeOf<keyof Meta>().toEqualTypeOf<"~TQuery" | "~TBody">();
      expectTypeOf<Meta["~TQuery"]>().toEqualTypeOf<TypeOf<{ foo: boolean }>>();
      expectTypeOf<Meta["~TBody"]>().toEqualTypeOf<TypeOf<{ bar: string }>>();
    });
  });
});
