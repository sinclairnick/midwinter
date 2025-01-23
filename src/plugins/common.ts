export type HttpVerb =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "options"
  | "head";

export type HttpMethodInput = HttpVerb | Uppercase<HttpVerb> | (string & {});
