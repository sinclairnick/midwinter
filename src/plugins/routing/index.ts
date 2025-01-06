import { Midwinter } from "@/midwinter/midwinter";
import { createRouter as createRadixRouter } from "./routers/radix";
import { createRouter as createLinearRouter } from "./routers/linear";
import { RequestHandler } from "@/middleware/types";
import { AnyCtx } from "@/types/util";
import { RouteInput } from "./routers/types";

export type RoutingInitOpts = {
  createRouter?: typeof createLinearRouter;
};

export type RoutingOpts = {
  path?: string;
  method?: string[] | string;
  prefix?: string;
};

export type RouteHandlerList = RequestHandler<any, RoutingOpts | AnyCtx>[];
export type RouteHandlerMap = Record<
  string,
  RequestHandler<any, RoutingOpts | AnyCtx>
>;

export type RouterOpts = {
  onNotFound?: (request: Request) => Response;
  onError?: (error: unknown) => Response;
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
    } = opts;

    const _routes: RouteInput<RequestHandler<any, RoutingOpts | AnyCtx>>[] = (
      Array.isArray(routes) ? routes : Object.values(routes)
    ).map((route) => {
      const { method, path, prefix } = route.meta ?? {};

      return {
        methods: Array.isArray(method) ? method : [String(method)],
        path: `${prefix}${path}`,
        payload: route,
      };
    });

    const router = createRouter(_routes);

    return async (request: Request) => {
      try {
        const handler = router.match(request);

        if (handler) {
          return await handler(request, {}, handler.meta);
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
