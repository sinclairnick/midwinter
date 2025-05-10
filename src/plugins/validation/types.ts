import { AnyCtx, AnyMeta, Awaitable, Strip } from "@/types/util";
import { Infer, InferIn, Parser } from "schema-shift";
import { TypeKey, TypeOf, Typify } from "../util";

// Schema values

export type ValidSchemaOpts = {
  Query?: Parser;
  Params?: Parser;
  Body?: Parser;
  Headers?: Parser;
  Output?: Parser;
};

export type ValidSchemaCtx<T extends ValidSchemaOpts> = {
  params: unknown extends T["Params"] ? Default["Params"] : Infer<T["Params"]>;
  query: unknown extends T["Query"] ? Default["Query"] : Infer<T["Query"]>;
  body: unknown extends T["Body"] ? Default["Body"] : Infer<T["Body"]>;
  headers: unknown extends T["Headers"]
    ? Default["Headers"]
    : Infer<T["Headers"]>;
};

export type ValidLazySchemaCtx<T extends ValidSchemaOpts> = {
  parse: ParseInputsFn<ValidSchemaCtx<T>>;
};

export type ValidSchemaMeta<T extends ValidSchemaOpts> = T &
  Typify<
    Strip<
      // In and Out Variants
      {
        [Key in keyof T & string as `${Key}_Out`]: Infer<T[Key]>;
      } & {
        [Key in keyof T & string as `${Key}_In`]: InferIn<T[Key]>;
      },
      [never, never]
    >
  >;

// Direct types

export type ValidTypeOpts = {
  Query?: Record<string, any>;
  Params?: Record<string, any>;
  Headers?: Record<string, any>;
  Body?: unknown;
  Output?: unknown;
};

export type ValidTypeCtx<T extends ValidTypeOpts> = {
  params: unknown extends T["Params"] ? Default["Params"] : T["Params"];
  query: unknown extends T["Query"] ? Default["Query"] : T["Query"];
  body: unknown extends T["Body"] ? Default["Body"] : T["Body"];
  headers: unknown extends T["Headers"] ? Default["Headers"] : T["Headers"];
};

export type ValidLazyTypeCtx<T extends ValidTypeOpts> = {
  parse: ParseInputsFn<ValidTypeCtx<T>>;
};

export type ValidTypeMeta<T extends ValidTypeOpts> = Typify<
  Strip<
    { [Key in keyof T & string as `${Key}_Out`]: T[Key] } & {
      [Key in keyof T & string as `${Key}_In`]: T[Key];
    },
    never
  >
>;

// Misc

export type Default = {
  Params: Record<string, string | undefined>;
  Query: Record<string, string | undefined>;
  Body: unknown;
  Headers: Record<string, string | undefined>;
};

export type OutputHandler<
  TValue extends any = unknown,
  TCtx extends AnyCtx = AnyCtx,
  TMetaIn extends AnyMeta = AnyMeta
> = (
  request: Request,
  ctx: TCtx,
  meta: Readonly<TMetaIn>
) => Awaitable<TValue | Response>;

export type InputTypeKey = "params" | "query" | "body" | "headers";

export interface ParseInputsFn<T extends Record<InputTypeKey, any>> {
  /** Parses the selected input part */
  <TKey extends InputTypeKey>(key: TKey): Promise<T[TKey]>;

  // This one needs to be below the generic one
  // for types to work.
  /** Parses all inputs and returns as an object */
  (): Promise<T>;
}

export type InferMetaOutputIn<TMeta extends AnyMeta> =
  TMeta[TypeKey<"Output_In">] extends TypeOf<infer Inner> ? Inner : any;

export type ParseQueryStringFn = (url: URL) => Record<PropertyKey, unknown>;
