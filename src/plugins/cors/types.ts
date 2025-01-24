import { AnyCtx, AnyMeta, Awaitable, UnknownValues } from "@/types/util";
import { HttpMethodInput } from "../common";

/**
 * Defines the CORS-related headers.
 *
 * Each option corresponds to it's own `Access-Control-X` header.
 */
export type CorsHeaderOptions = {
  /**
   * An origin or list of origins to allow
   *
   * @default
   * "*"
   */
  allowOrigin?: string | string[];

  /**
   * A list of allowed methods.
   *
   * @default
   * ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"]
   */
  allowMethods?: HttpMethodInput[];

  /**
   * A list of allowed header keys.
   *
   * @default
   * []
   */
  allowHeaders?: string[];

  /**
   * Whether to allow credentials.
   *
   * @default
   * false
   */
  allowCredentials?: boolean;

  /**
   * Max age.
   *
   * @default
   * undefined
   */
  maxAge?: number;

  /**
   * Expose headers.
   *
   * @default
   * []
   */
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
