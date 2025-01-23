import { Midwinter } from "midwinter";
import { createRouter as createRadixRouter } from "./routers/radix";
import { createRouter as createLinearRouter } from "./routers/linear";
import { RequestHandler } from "@/middleware/types";
import { RouteInput } from "./routers/types";
import { HttpMethodInput } from "../common";
import { InferPathParams, parsePathParams } from "./util";

export type RoutingInitOpts = {
  router?: typeof createLinearRouter;
};

export type RoutingOpts = {
  path?: string;
  method?: HttpMethodInput[] | HttpMethodInput;
  prefix?: string;
};
export type RoutingOptsWithPath = {
  path: string;
  method?: HttpMethodInput[] | HttpMethodInput;
  prefix?: string;
};

export type RouteHandlerList = RequestHandler[];
export type RouteHandlerMap = Record<string, RequestHandler>;

export type RouterOpts = {
  onNotFound?: (request: Request) => Response;
  onError?: (error: unknown) => Response;
  /**
   * @default false
   */
  keepTrailingSlashes?: boolean;
};

interface InitRoutingReturn {
  createRouter(
    routes: RouteHandlerList | RouteHandlerMap,
    opts?: RouterOpts
  ): (request: Request) => Promise<Response>;

  // Route
  route<const T extends RoutingOptsWithPath>(
    config: T
  ): Midwinter<{}, T & { params: InferPathParams<T["path"]> }>;
  route<const T extends RoutingOpts>(config: T): Midwinter<{}, T>;
}

export const init = (opts: RoutingInitOpts = {}): InitRoutingReturn => {
  const { router = createRadixRouter } = opts;

  return {
    route<const T extends RoutingOpts>(config: T): Midwinter<{}, T> {
      if (config.path == null) {
        return new Midwinter(config);
      }

      return new Midwinter({
        ...config,
        params: parsePathParams(config.path),
      });
    },
    createRouter(
      routes: RouteHandlerList | RouteHandlerMap,
      opts: RouterOpts = {}
    ) {
      const {
        onNotFound = () => {
          return Response.json({ code: "NOT_FOUND" }, { status: 404 });
        },
        onError = () => {
          return Response.json({ code: "SERVER_EXCEPTION" }, { status: 500 });
        },
        keepTrailingSlashes = false,
      } = opts;

      const _routes: RouteInput<RequestHandler>[] = (
        Array.isArray(routes) ? routes : Object.values(routes)
      ).map((route) => {
        const { method, path, prefix } = route.meta ?? {};

        // TODO: Add warnings/validation

        const _path =
          typeof prefix === "string" && prefix.length > 0
            ? `${prefix}${path}`
            : String(path);

        return {
          methods: Array.isArray(method) ? method : [String(method)],
          path: keepTrailingSlashes ? _path : _path.replace(/\/$/, ""),
          payload: route,
        };
      });

      const _router = router(_routes);

      return async (request: Request) => {
        try {
          const handler = _router.match(request);

          if (handler) {
            return await handler(request);
          }

          return onNotFound(request);
        } catch (e) {
          return onError(e);
        }
      };
    },
  };
};

export const LinearRouter = createLinearRouter;
export const RadixRouter = createRadixRouter;
