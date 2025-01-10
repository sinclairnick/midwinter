import { AnyMidwinter, Midwinter } from "@/midwinter/midwinter";
import { AnyCtx } from "..";
import {
  AnyMeta,
  Awaitable,
  MergeObjectsShallow,
  UnknownValues,
} from "../types/util";

export type ResponseHandler = (
  response: Response
) => Awaitable<Response | undefined | void>;

export type MiddlewareReturn<TCtxUpdate extends AnyCtx | void = void> =
  | TCtxUpdate
  | Response
  | ResponseHandler
  | void;

export type AnyMiddleware = Middleware<any, any, any, any>;

export type AnyEndMiddlewareHandler = EndMiddlewareHandler<any, any>;

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
  ctx: TCtx & AnyCtx,
  meta: Readonly<UnknownValues<TMetaIn>>
) => Awaitable<MiddlewareReturn<TCtxUpdate>>;

export type RequestHandler<
  TMeta extends AnyMeta = AnyMeta,
  TResult extends Response | undefined = Response
> = ((request: Request) => Promise<TResult>) & { meta: TMeta };

export type Middleware<
  TCtxUpdate extends AnyCtx | void | undefined = AnyCtx,
  TCtx extends AnyCtx = AnyCtx,
  TMetaUpdate extends AnyMeta | void = void,
  TMetaIn extends AnyMeta = AnyMeta
> = void extends TMetaUpdate
  ? MiddlewareHandler<TCtxUpdate, TCtx, TMetaIn>
  : MiddlewareHandler<TCtxUpdate, TCtx, TMetaIn> & { meta: TMetaUpdate };

export type EndMiddleware<
  TCtx extends AnyCtx = AnyCtx,
  TMetaUpdate extends AnyMeta | void = void,
  TMetaIn extends AnyMeta = AnyMeta
> = void extends TMetaUpdate
  ? EndMiddlewareHandler<TCtx, TMetaIn>
  : EndMiddlewareHandler<TCtx, TMetaIn> & { meta: TMetaUpdate };

export type NextMiddlewareContext<TMid extends AnyMiddleware> =
  TMid extends Middleware<infer $Updates, infer $Ctx, any, any>
    ? MergeCtx<$Updates, $Ctx>
    : never;

export type MergeCtx<
  TUpdates extends AnyCtx | void,
  TCtx extends AnyCtx | void
> = void extends TUpdates
  ? TCtx
  : undefined extends TUpdates
  ? MergeObjectsShallow<TCtx, Partial<TUpdates>>
  : MergeObjectsShallow<TCtx, TUpdates>;

export type MergeMeta<
  TUpdates extends AnyMeta | void,
  TMeta extends AnyMeta | void
> = void extends TUpdates
  ? TMeta
  : undefined extends TUpdates
  ? MergeObjectsShallow<TMeta, Partial<TUpdates>>
  : MergeObjectsShallow<TMeta, TUpdates>;
