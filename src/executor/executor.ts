import { Middleware, ResponseHandler } from "../middleware/types";
import { AnyCtx, AnyMeta } from "../types/util";
import { isResponse } from "../util/request";

export type MiddlewareAction =
  | { type: "response"; response: Response }
  | { type: "update"; update: AnyCtx };

/**
 * A basic middleware executor which executes inbound middleware
 * in registration-order and outbound middleware in the reverse.
 */
export class MiddlewareExecutor<
  TCtx extends AnyCtx = AnyCtx,
  TMeta extends AnyMeta = AnyMeta
> {
  public responseHandlers: ResponseHandler[] = [];

  constructor(public middlewares: Middleware<any, any>[] = []) {}

  append(...middlewares: Middleware<any, any>[]) {
    this.middlewares.push(...middlewares);
  }

  /**
   * Invokes the the pre-handler middleware and registers any response handlers.
   *
   * Note: this method must be invoked for response/outbound middleware to be registered for `.post()`.
   *
   * @returns An async generator which is used to execute and
   * optionally "listen" to and respond to middleware events as they occur.
   *
   * @example
   * ```ts
   * for await (const result of mid.pre(req)) {
   * 	// Optionally handle middleware events as they occur:
   * 	switch(result.type) {
   * 		case "update": {
   * 				ctx = { ...ctx, ...result.updates }
   * 			}
   * 		case "response": {
   * 				return next(result.response)
   * 			}
   * 		}
   * }
   * ```
   */
  async *pre(
    request: Request,
    ctx: TCtx,
    meta: TMeta
  ): AsyncGenerator<MiddlewareAction> {
    // Run middleware in sequence, recursively updating state
    for (const middleware of this.middlewares) {
      const result = await middleware(request, ctx, meta);

      // If early exit, return response
      if (result instanceof Response || isResponse(result)) {
        // Don't run remaining request middleware.
        // WARN: This also prevents the subsequent response middleware from
        // being registered.
        yield { type: "response", response: result } as const;
      }

      // If result is a function, it is a response handler
      else if (typeof result === "function") {
        this.responseHandlers.push(result as ResponseHandler);
        continue;
      }

      // If update
      else if (typeof result === "object") {
        yield { type: "update", update: result as AnyCtx } as const;
      }
    }
  }

  /**
   * Invokes the post-handler middleware in reverse-order to that which the middleware was registered.
   *
   * Note: this method requires running `.pre` before hand.
   *
   * @returns The final `response` object.
   *
   * @example
   * ```ts
   * const finalResponse = await mid.post(response)
   *
   * return finalResponse
   * ```
   */
  async post(response: Response) {
    let _response = response;

    // Iterate through response handlers backwards
    for (let i = this.responseHandlers.length - 1; i >= 0; i--) {
      const handler = this.responseHandlers[i];
      const result = await handler(response);

      // Set response if one was returned
      if (result) {
        _response = result;
      }
    }

    return _response;
  }
}
