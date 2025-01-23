import { AnyCtx, AnyMeta, Awaitable, UnknownValues } from "@/types/util";
import { HttpMethodInput } from "../common";

/**
 * Defines the CORS-related headers.
 *
 * Each option corresponds to it's own `Access-Control-X` header.
 */
export type CorsHeaderOptions = {
  allowOrigin?: string | string[];
  allowMethods?: HttpMethodInput[];
  allowHeaders?: string[];
  allowCredentials?: boolean;
  maxAge?: number;
  exposeHeaders?: string[];
};

export type CorsHeaderFn<
  TCtx extends AnyCtx = AnyCtx,
  TMeta extends AnyMeta = AnyMeta
> = (
  req: Request,
  ctx: TCtx,
  meta: Readonly<UnknownValues<TMeta>>
) => Awaitable<CorsHeaderOptions | undefined>;

export type CorsOptions<
  TCtx extends AnyCtx = AnyCtx,
  TMeta extends AnyMeta = AnyMeta
> = CorsHeaderFn<TCtx, TMeta> | CorsHeaderOptions;
