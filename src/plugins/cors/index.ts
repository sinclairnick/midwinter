// This middleware is based on the Hono Cors middleware.

import { Middleware } from "midwinter";
import { CorsOptions } from "./types";
import { AccessControlHeader, handlePreflight, setOriginHeaders } from "./util";
import { AnyCtx, AnyMeta } from "@/types/util";

export const init = () => {
  const cors = <TCtx extends AnyCtx = AnyCtx, TMeta extends AnyMeta = AnyMeta>(
    options?: CorsOptions<TCtx, TMeta>
  ): Middleware<void, TCtx, void, TMeta> => {
    return async (req, ctx, meta) => {
      const {
        allowOrigin = "*",
        allowMethods = ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
        allowHeaders = [],
        exposeHeaders = [],
        allowCredentials = false,
        maxAge,
      } = (typeof options === "function"
        ? await options(req, ctx, meta)
        : options) ?? {};

      return (res: Response) => {
        const headers = new Headers(res.headers);

        setOriginHeaders({ allowOrigin }, headers);

        if (allowCredentials) {
          headers.set(AccessControlHeader.AllowCredentials, "true");
        }

        if (exposeHeaders.length) {
          headers.set(
            AccessControlHeader.ExposeHeaders,
            exposeHeaders.join(",")
          );
        }

        if (req.method.toUpperCase() === "OPTIONS") {
          return handlePreflight(
            { allowMethods, maxAge, allowHeaders },
            headers,
            req
          );
        }

        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: headers,
        });
      };
    };
  };

  return { cors };
};
