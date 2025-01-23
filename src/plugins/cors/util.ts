import { CorsHeaderOptions } from "./types";

export const AccessControlHeader = {
  AllowOrigin: "Access-Control-Allow-Origin",
  AllowCredentials: "Access-Control-Allow-Credentials",
  AllowMethods: "Access-Control-Allow-Methods",
  AllowHeaders: "Access-Control-Allow-Headers",
  RequestHeaders: "Access-Control-Request-Headers",
  ExposeHeaders: "Access-Control-Expose-Headers",
  MaxAge: "Access-Control-Max-Age",
} as const;

export const setOriginHeaders = (
  { allowOrigin }: Pick<CorsHeaderOptions, "allowOrigin">,
  headers: Headers
) => {
  if (!allowOrigin) return;

  const origin = headers.get("origin");

  // if "*"
  if (allowOrigin === "*") {
    headers.set(AccessControlHeader.AllowOrigin, "*");
    return;
  }

  const existingVary = headers.get("Vary");
  headers.set("Vary", existingVary ?? "Origin");

  // if string
  if (typeof allowOrigin === "string") {
    headers.set(AccessControlHeader.AllowOrigin, allowOrigin);
    return;
  }

  // if string[]
  if (
    Array.isArray(allowOrigin) &&
    typeof origin === "string" &&
    allowOrigin.includes(origin)
  ) {
    headers.set(AccessControlHeader.AllowOrigin, origin);
  }
};

export const handlePreflight = (
  {
    allowMethods,
    maxAge,
    ...opts
  }: Pick<CorsHeaderOptions, "maxAge" | "allowMethods" | "allowHeaders">,
  headers: Headers,
  req: Request
): Response => {
  if (maxAge != null) {
    headers.set(AccessControlHeader.MaxAge, maxAge.toString());
  }

  if (allowMethods?.length) {
    headers.set(AccessControlHeader.AllowMethods, allowMethods.join(","));
  }

  let allowHeaders = opts.allowHeaders;

  if (!allowHeaders?.length) {
    const requestHeaders = req.headers.get(AccessControlHeader.RequestHeaders);

    if (requestHeaders) {
      allowHeaders = requestHeaders.split(/\s*,\s*/);
    }
  }

  if (allowHeaders?.length) {
    headers.set(AccessControlHeader.AllowHeaders, allowHeaders.join(","));
    headers.append("Vary", AccessControlHeader.RequestHeaders);
  }

  headers.delete("Content-Length");
  headers.delete("Content-Type");

  return new Response(null, {
    headers,
    status: 204,
    statusText: "No Content",
  });
};
