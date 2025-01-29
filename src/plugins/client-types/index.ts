import { RequestHandler } from "@/index";
import { DefaultTo, MergeObjectsShallow } from "@/types/util";
import { Infer, InferIn } from "schema-shift";

export type InferConfig<THandler extends RequestHandler> =
  THandler extends RequestHandler<infer $Meta, any>
    ? {
        Query: InferIn<$Meta["Query"]>;
        Params: $Meta["params"] extends string[]
          ? MergeObjectsShallow<
              { [Key in $Meta["params"][number]]: string },
              DefaultTo<InferIn<$Meta["Params"]>, {}>
            >
          : InferIn<$Meta["Params"]>;
        Body: InferIn<$Meta["Body"]>;
        Output: Infer<$Meta["Output"]>;
      }
    : never;

type FormatMethod<T extends string> = T extends "*" ? string : T;

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
