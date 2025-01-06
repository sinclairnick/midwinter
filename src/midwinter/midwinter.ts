import {
  AnyMiddleware,
  RequestHandler,
  EndMiddlewareHandler,
  Middleware,
  NextMiddlewareContext,
} from "../middleware/types";
import { MiddlewareExecutor } from "../executor/executor";
import { AnyCtx, AnyMeta, MergeObjectsShallow } from "../types/util";
import { fixRequestClone } from "../util/request";

export type AnyMidwinter = Midwinter<any, any>;

/**
 * A simple way to construct complex middleware pipelines with type-safety
 * and introspectability.
 */
export class Midwinter<
  TCtx extends AnyCtx = AnyCtx,
  TMeta extends AnyMeta = AnyMeta
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
  use<
    TCtxUpdate extends AnyCtx | void = void,
    TMetaUpdate extends AnyMeta | void = void
  >(middleware: Middleware<TCtxUpdate, TCtx, TMetaUpdate, TMeta>) {
    let meta = { ...this.meta };

    if ("meta" in middleware && middleware.meta != null) {
      meta = { ...meta, ...middleware.meta } as any;
    }

    return new Midwinter<
      NextMiddlewareContext<typeof middleware>,
      void extends TMetaUpdate ? TMeta : MergeObjectsShallow<TMeta, TMetaUpdate>
    >(meta as any, [...this.middlewares, middleware]);
  }

  /**
   * Defines a middleware without registering it on the stack.
   *
   * This method is useful for defining reusable middleware, while
   * still capturing any context dependencies that may be required.
   *
   * @param middleware
   * @param meta
   * @returns
   */

  // Middleware only
  define<TCtxUpdate extends AnyCtx | void = void, TCtxIn extends AnyCtx = TCtx>(
    middleware: Middleware<TCtxUpdate, TCtxIn, void, TMeta>
  ): Middleware<TCtxUpdate, TCtxIn, void, TMeta>;

  // Both
  define<
    TCtxUpdate extends AnyCtx | void = AnyCtx,
    TCtxIn extends AnyCtx = TCtx,
    TMetaUpdate extends AnyMeta | void = void
  >(
    middleware: Middleware<TCtxUpdate, TCtxIn, void, TMeta>,
    meta: TMetaUpdate
  ): Middleware<TCtxUpdate, TCtx, TMetaUpdate, TMeta>;

  // Handler
  define<
    TCtxUpdate extends AnyCtx | void = void,
    TCtxIn extends AnyCtx = TCtx,
    TMetaUpdate extends AnyMeta | void = void
  >(
    middleware: Middleware<TCtxUpdate, TCtxIn, void, TMeta>,
    meta?: TMetaUpdate
  ) {
    if (meta) {
      return Object.assign(middleware, { meta });
    }

    return middleware;
  }

  end(middleware: EndMiddlewareHandler<TCtx, TMeta>): RequestHandler<TMeta> {
    const handler = async (request: Request) => {
      const req = fixRequestClone(request);

      let _ctx = {} as TCtx;

      const executor = new MiddlewareExecutor(this.middlewares);

      let response: Response | undefined;

      for await (const result of executor.pre(req, _ctx, this.meta)) {
        switch (result.type) {
          case "response": {
            response = response;
            break;
          }
          case "update": {
            _ctx = { ..._ctx, ...result.update };
          }
        }
      }

      if (response == null) {
        response = await middleware(req, _ctx, this.meta);
      }

      return executor.post(response);
    };

    return Object.assign(handler, { meta: this.meta });
  }
}
