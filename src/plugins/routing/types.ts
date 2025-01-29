import { MergeObjectsShallow, Strip } from "@/types/util";
import { InferPathParams } from "./util";
import { Midwinter, RequestHandler } from "midwinter";
import { HttpMethodInput } from "../common";

export type RoutingOpts = {
  path?: string;
  method?: HttpMethodInput[] | HttpMethodInput;
};
export type RoutingOptsWithPath = Omit<RoutingOpts, "path"> & {
  path: string;
  method?: HttpMethodInput[] | HttpMethodInput;
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

export interface InitRoutingReturn {
  createRouter(
    routes: RouteHandlerList | RouteHandlerMap,
    opts?: RouterOpts
  ): (request: Request) => Promise<Response>;

  // Route
  route<const T extends RoutingOptsWithPath>(
    config: T
  ): Midwinter<{}, ConfigWithPath<T>>;
  route<const T extends RoutingOpts>(config: T): Midwinter<{}, T>;

  prefixed<TPrefix extends string>(
    prefix: TPrefix
  ): <const T extends RoutingOptsWithPath | RoutingOpts>(
    config: T
  ) => Midwinter<
    {},
    // Whether or not a path is passed, the result will have a path
    ConfigWithPath<WithPrefix<T, TPrefix>>
  >;
}

type ToString<T> = T extends string ? T : "";

export type WithPrefix<T extends RoutingOpts, TPrefix extends string> = Omit<
  T,
  "path"
> & {
  path: `${TPrefix}${ToString<T["path"]>}`;
};

export type ConfigWithPath<T extends RoutingOpts> = MergeObjectsShallow<
  T,
  Strip<{ params: InferPathParams<T["path"]>[] }, never[]>
>;
