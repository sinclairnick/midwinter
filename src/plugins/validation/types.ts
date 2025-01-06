import { AnyCtx, AnyMeta, Awaitable } from "@/types/util";
import { Parser } from "schema-shift";

export type ValidReturn<
  TQuery = unknown,
  TParams = unknown,
  TBody = unknown,
  THeaders = unknown
> = {
  query: TQuery;
  params: TParams;
  body: TBody;
  headers: THeaders;
};

export type InputTypeKey = "params" | "query" | "body" | "headers";

export interface ParseInputsFn<
  TParams = Default["Params"],
  TQuery = Default["Query"],
  TBody = Default["Body"],
  THeaders = Default["Headers"]
> {
  /** Parses the selected input part */
  <T extends InputTypeKey>(key: T): Promise<
    {
      params: TParams;
      query: TQuery;
      body: TBody;
      headers: THeaders;
    }[T]
  >;

  /** Parses all inputs and returns as an object */
  (): Promise<{
    params: TParams;
    query: TQuery;
    body: TBody;
    headers: THeaders;
  }>;
}

export type ValidOpts = {
  Query?: Parser;
  Params?: Parser;
  Body?: Parser;
  Headers?: Parser;
  Output?: Parser;
};

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
