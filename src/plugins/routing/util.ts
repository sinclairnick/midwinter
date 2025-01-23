export type InferPathParams<T> = T extends `${string}:${infer P}/${infer R}`
  ? P | InferPathParams<R>
  : T extends `${string}:${infer P}`
  ? P
  : never;

export const parsePathParams = <T extends string>(
  path: T
): InferPathParams<T>[] => {
  const parts = path.split("/");
  const params: string[] = [];

  for (const part of parts) {
    if (part.startsWith(":")) {
      params.push(part.replace(/^:/, ""));
    }
  }

  return params as InferPathParams<T>[];
};
