import { RequestHandler } from "@/index";
import { MergeObjectsShallow, Strip } from "@/types/util";
import { InferTypeof, TypeKey } from "../util";

export type InferConfig<THandler extends RequestHandler> =
  THandler extends RequestHandler<infer $Meta, any>
    ? Strip<
        {
          Query: InferTypeof<$Meta[TypeKey<"Query_In">]>;
          Params: $Meta["params"] extends string[]
            ? MergeObjectsShallow<
                { [Key in $Meta["params"][number]]: string },
                InferTypeof<$Meta[TypeKey<"Params_In">], {}>
              >
            : InferTypeof<$Meta[TypeKey<"Params_In">]>;
          Body: InferTypeof<$Meta[TypeKey<"Body_In">]>;
          Output: InferTypeof<$Meta[TypeKey<"Output_Out">]>;
        },
        never
      >
    : never;

export type FormatMethod<T extends string> = T extends "*" ? string : T;

export type InferMethod<THandler extends RequestHandler> =
  THandler extends RequestHandler<infer $Meta, any>
    ? $Meta["method"] extends string
      ? FormatMethod<$Meta["method"]>
      : $Meta["method"] extends string[]
      ? FormatMethod<$Meta["method"][number]>
      : never
    : never;

export type InferPath<THandler extends RequestHandler> =
  THandler["meta"]["path"] extends string ? THandler["meta"]["path"] : never;

export type InferAppInput = Record<PropertyKey, RequestHandler>;

export type InferApp<TInput extends InferAppInput> = {
  [Key in keyof TInput as `${Uppercase<InferMethod<TInput[Key]>>} ${InferPath<
    TInput[Key]
  >}`]: InferConfig<TInput[Key]>;
};
