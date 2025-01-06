import { Midwinter } from "@/midwinter/midwinter";
import { createRouter as createRadixRouter } from "./routers/radix";
import { createRouter as createLinearRouter } from "./routers/linear";
import { RequestHandler } from "@/middleware/types";
import { RouteInput } from "./routers/types";

export type RoutingInitOpts = {
  createRouter?: typeof createLinearRouter;
};

export type RoutingOpts = {
  path?: string;
  method?: string[] | string;
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

export const init = (opts: RoutingInitOpts = {}) => {
  const { createRouter = createRadixRouter } = opts;

  const mid = new Midwinter();

  const routing = <const T extends RoutingOpts>(config: T) => {
    return mid.define(() => {}, config);
  };

  const router = (
    routes: RouteHandlerList | RouteHandlerMap,
    opts: RouterOpts = {}
  ) => {
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

    const router = createRouter(_routes);

    return async (request: Request) => {
      try {
        const handler = router.match(request);

        if (handler) {
          return await handler(request);
        }

        return onNotFound(request);
      } catch (e) {
        return onError(e);
      }
    };
  };

  return { routing, router };
};

export const LinearRouter = createLinearRouter;
export const RadixRouter = createRadixRouter;
