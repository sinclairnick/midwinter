import { Midwinter, RequestHandler } from "midwinter";
import { createSpec as _createSpec } from "sprinkle-oas";

export type InitOpts = {
  toJsonSchema?: (schema: unknown) => Record<PropertyKey, any>;
};

export type OpenApiOpts = {};

export type CreateSpecInput =
  | Record<PropertyKey, RequestHandler>
  | RequestHandler[];

export const init = () => {
  const openapi = (opts: OpenApiOpts) => {
    return new Midwinter({ openapi: opts });
  };

  const createSpec = (input: CreateSpecInput) => {
    const routes: [] = [];

    for (const entry in input) {
      const route = input[entry];

      const { openapi, path, method, Query, Params, Body, Headers, Output } =
        route.meta;

      // TODO: Validate/warn

      // TODO: Push to routes
    }

    return _createSpec(routes);
  };

  return { openapi, createSpec };
};
