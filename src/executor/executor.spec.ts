import { describe, expect, test } from "vitest";
import { MiddlewareExecutor } from "./executor";
import { AnyCtx } from "@/types/util";

describe("Executor", () => {
  test("Runs pre middleware in order", async () => {
    const runs: number[] = [];

    const mid = new MiddlewareExecutor([
      (req) => {
        runs.push(1);
      },
      (req) => {
        runs.push(2);
      },
      (req) => {
        runs.push(3);
      },
    ]);

    const req = new Request("https://test.com");

    for await (const result of mid.pre(req, {}, {})) {
      // Noop
    }

    expect(runs).toHaveLength(3);
    expect(runs[0]).toBe(1);
    expect(runs[1]).toBe(2);
    expect(runs[2]).toBe(3);
  });

  test("Runs post middleware in reverse order", async () => {
    const runs: number[] = [];

    const mid = new MiddlewareExecutor([
      (req) => {
        return () => {
          runs.push(1);
        };
      },
      (req) => {
        return () => {
          runs.push(2);
        };
      },
      (req) => {
        return () => {
          runs.push(3);
        };
      },
    ]);

    const req = new Request("https://test.com");

    for await (const result of mid.pre(req, {}, {})) {
      // Noop
    }

    await mid.post(Response.json({}));

    expect(runs).toHaveLength(3);
    expect(runs[0]).toBe(3);
    expect(runs[1]).toBe(2);
    expect(runs[2]).toBe(1);
  });

  test("Yields ctx updates", async () => {
    const mid = new MiddlewareExecutor([
      (req) => {
        return { foo: "bar" };
      },
    ]);

    const req = new Request("https://test.com");

    const updates: AnyCtx[] = [];

    for await (const result of mid.pre(req, {}, {})) {
      if (result.type === "update") {
        updates.push(result.update);
      }
    }

    expect(updates).toHaveLength(1);
    expect(updates[0]).toEqual({ foo: "bar" });
  });

  test("Does not yield ctx mutations", async () => {
    const mid = new MiddlewareExecutor([
      (req, ctx) => {
        ctx.foo = "bar";
      },
    ]);

    const req = new Request("https://test.com");

    const updates: AnyCtx[] = [];

    for await (const result of mid.pre(req, {}, {})) {
      updates.push(result);
    }

    expect(updates).toHaveLength(0);
  });

  test("Returns responses", async () => {
    const mid = new MiddlewareExecutor([
      (req, ctx) => {
        return Response.json({});
      },
    ]);

    let hasRes = false;

    const req = new Request("https://test.com");

    for await (const result of mid.pre(req, {}, {})) {
      if (result.type === "response") {
        hasRes = true;
      }
    }

    expect(hasRes).toBeTruthy();
  });
});
