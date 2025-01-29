import { MergeObjectsShallow, NonReadonly, Strip } from "@/types/util";
import { RoutingOpts } from ".";
import { InferPathParams } from "./util";

type ToString<T> = T extends string ? T : "";

export type WithInferredParams<T extends RoutingOpts> = T & {
  params: InferPathParams<T["path"]>[];
};

export type ParsedConfig<T extends RoutingOpts> = NonReadonly<
  MergeObjectsShallow<
    T,
    Strip<
      WithInferredParams<{
        path: `${ToString<T["prefix"]>}${ToString<T["path"]>}`;
      }>,
      never[]
    >
  >
>;
