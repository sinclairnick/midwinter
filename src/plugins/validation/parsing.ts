import { Infer, parse } from "schema-shift";
import { Default, InputTypeKey, ParseInputsFn, ValidOpts } from "./types";

const cached = <T extends () => any>(fn: T) => {
  let called = false;
  let result: ReturnType<T>;

  return async () => {
    if (called) return result;
    result = await fn();
    called = true;
    return result;
  };
};

export type ParseOpts = ValidOpts & {
  path?: string;
};

export type ParserFn<T = any> = (req: Request, opts: ParseOpts) => T;

export const parseQuery = ((req, opts) => {
  const url = new URL(req.url);

  const map: Record<string, any> = {};
  for (const [key, value] of url.searchParams.entries()) {
    map[key] = value;
  }

  return opts.Query ? parse(opts.Query, map) : map;
}) satisfies ParserFn;

export const parseParams = ((req, opts) => {
  const url = new URL(req.url);

  if (opts.path == null) {
    throw "Cannot parse params without a known `path` string.";
  }

  const patternParts = opts.path?.split("/");
  const PathParts = url.pathname.split("/");

  const map: Record<string, any> = {};
  for (let i = 0; i <= patternParts.length; i++) {
    const pattern: string | undefined = patternParts[i];
    const Path: string | undefined = PathParts[i];

    if (pattern == null || Path == null) break;

    if (pattern.startsWith(":")) {
      map[pattern.slice(1)] = Path;
    }
  }

  return opts.Params ? parse(opts.Params, map) : map;
}) satisfies ParserFn;

export const parseBody = (async (req, opts) => {
  const contentType = req.headers.get("content-type");

  if (opts.Body) {
    const data = await req.json();
    return parse(opts.Body, data);
  }

  if (contentType === "application/json") {
    return req.json();
  }

  if (contentType?.startsWith("text/")) {
    return req.text();
  }

  return req.body;
}) satisfies ParserFn;

export const parseHeaders = ((req, opts) => {
  const map: Record<string, any> = {};
  for (const [key, value] of req.headers.entries()) {
    map[key] = value;
  }

  return opts.Headers ? parse(opts.Headers, map) : map;
}) satisfies ParserFn;

export const getCachedParsers = (req: Request, opts: ParseOpts) => {
  return {
    query: cached(() => parseQuery(req, opts)),
    params: cached(() => parseParams(req, opts)),
    headers: cached(() => parseHeaders(req, opts)),
    body: cached(() => parseBody(req, opts)),
  };
};

export const makeParseFn = <T extends ParseOpts>(req: Request, opts: T) => {
  const parsers = getCachedParsers(req, opts);

  const parse = async <T extends InputTypeKey>(key?: T) => {
    if (key) {
      return parsers[key]();
    }

    const [_query, _params, _headers, _body] = await Promise.all([
      parsers.query,
      parsers.params,
      parsers.headers,
      parsers.body,
    ]);

    return {
      query: _query,
      params: _params,
      headers: _headers,
      body: _body,
    };
  };

  return parse as ParseInputsFn<
    unknown extends T["Params"] ? Default["Params"] : Infer<T["Params"]>,
    unknown extends T["Query"] ? Default["Query"] : Infer<T["Query"]>,
    unknown extends T["Body"] ? Default["Body"] : Infer<T["Body"]>,
    unknown extends T["Headers"] ? Default["Headers"] : Infer<T["Headers"]>
  >;
};
