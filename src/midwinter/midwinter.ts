import {
  AnyMiddleware,
  RequestHandler,
  Middleware,
  MergeCtx,
  MergeMeta,
  EndMiddleware,
} from "../middleware/types";
import { MiddlewareExecutor } from "../executor/executor";
import { AnyCtx, AnyMeta } from "../types/util";

export type AnyMidwinter = Midwinter<any, any, any>;

/**
 * A simple way to construct complex middleware pipelines with type-safety
 * and introspectability.
 */
export class Midwinter<
  TCtx extends AnyCtx = {},
  TMeta extends AnyMeta = {},
  TCtxInitial extends AnyCtx = TCtx
> {
  constructor(
    private meta: TMeta = {} as any,
    private middlewares: AnyMiddleware[] = []
  ) {}

  /**
   * Registers a middleware with the current middleware stack.
   *
   * @param middleware
   * @returns A new midwinter instance with any context or meta changes applied, and the new
   * middleware registered.
   */
  // Middleware
  use<
    TCtxUpdate extends AnyCtx | void = void,
    TMetaUpdate extends AnyMeta | void = void
  >(
    middleware: Middleware<TCtxUpdate, TCtx, TMetaUpdate, TMeta>
  ): Midwinter<
    MergeCtx<TCtxUpdate, TCtx>,
    MergeMeta<TMetaUpdate, TMeta>,
    TCtxInitial
  >;

  // Midwinter
  use<TNewCtx extends AnyCtx = AnyCtx, TNewMeta extends AnyMeta = AnyMeta>(
    midwinter: Midwinter<TNewCtx, TNewMeta, TCtx>
  ): Midwinter<
    MergeCtx<TNewCtx, TCtx>,
    MergeMeta<TNewMeta, TMeta>,
    TCtxInitial
  >;

  use(value: AnyMiddleware | AnyMidwinter) {
    let meta = { ...this.meta };

    if (value instanceof Midwinter) {
      return new Midwinter(
        {
          ...meta,
          ...value.meta,
        },
        [...this.middlewares, ...value.middlewares]
      );
    }

    if ("meta" in value && value.meta != null) {
      meta = { ...meta, ...value.meta } as any;
    }

    // Just to be defensive
    if (typeof value === "function") {
      return new Midwinter(meta, [...this.middlewares, value]) as any;
    }

    return new Midwinter(meta, [...this.middlewares]) as any;
  }

  end(): RequestHandler<TMeta, Response | undefined>;
  end<TMetaUpdate extends AnyMeta | void = void>(
    middleware: EndMiddleware<TCtx, TMetaUpdate, TMeta>
  ): RequestHandler<MergeMeta<TMetaUpdate, TMeta>>;
  end(middleware?: EndMiddleware<TCtx, any, TMeta>) {
    const meta = Object.freeze(this.meta);

    const handler = async (request: Request) => {
      // Must be const to retain reference
      const ctx = {} as TCtx;
      const executor = new MiddlewareExecutor(this.middlewares);

      // Using a nested function because `break`ing was causing a
      // strange bug by breaking in the _next_ iteration...
      // Bun issue?
      const runMiddleware = async (): Promise<Response | undefined> => {
        for await (const result of executor.pre(request, ctx, meta)) {
          switch (result.type) {
            case "response": {
              return result.response;
            }
            case "update": {
              for (const key in result.update) {
                (ctx as any)[key] = result.update[key];
              }
            }
          }
        }
      };

      let response = await runMiddleware();

      if (response == null) {
        response = await middleware?.(request, ctx, meta);
      }

      if (response != null) {
        return executor.post(response);
      }
    };

    return Object.assign(handler, { meta });
  }
}
