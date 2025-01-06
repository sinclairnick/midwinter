import { AnyCtx } from "..";
import { AnyMeta, Awaitable, MergeObjectsShallow } from "../types/util";

export type ResponseHandler = (
  response: Response
) => Awaitable<Response | undefined | void>;

export type MiddlewareReturn<TCtxUpdate extends AnyCtx | void = void> =
  | TCtxUpdate
  | Response
  | ResponseHandler
  | void;

export type AnyMiddleware = Middleware<any, any, any, any>;

export type EndMiddlewareHandler<
  TCtx extends AnyCtx = AnyCtx,
  TMetaIn extends AnyMeta = AnyMeta
> = (
  request: Request,
  ctx: TCtx,
  meta: Readonly<TMetaIn>
) => Awaitable<Response>;

type MiddlewareHandler<
  TCtxUpdate extends AnyCtx | void = AnyCtx,
  TCtx extends AnyCtx = AnyCtx,
  TMetaIn extends AnyMeta = AnyMeta
> = (
  request: Request,
  ctx: TCtx,
  meta: Readonly<TMetaIn>
) => Awaitable<MiddlewareReturn<TCtxUpdate>>;

export type RequestHandler<TMeta extends AnyMeta = AnyMeta> = ((
  request: Request
) => Promise<Response>) & { meta: TMeta };

export type Middleware<
  TCtxUpdate extends AnyCtx | void | undefined = AnyCtx,
  TCtx extends AnyCtx = AnyCtx,
  TMetaUpdate extends AnyMeta | void = void,
  TMetaIn extends AnyMeta = AnyMeta
> = void extends TMetaUpdate
  ? MiddlewareHandler<TCtxUpdate, TCtx, TMetaIn>
  : MiddlewareHandler<TCtxUpdate, TCtx, TMetaIn> & { meta: TMetaUpdate };

export type NextMiddlewareContext<TMiddleware extends AnyMiddleware> =
  TMiddleware extends Middleware<infer $Updates, infer $Ctx, any, any>
    ? void extends $Updates
      ? $Ctx
      : undefined extends $Updates
      ? MergeObjectsShallow<$Ctx, Partial<$Updates>>
      : MergeObjectsShallow<$Ctx, $Updates>
    : never;
