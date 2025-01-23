import { Midwinter } from "@/midwinter/midwinter";
import { trace } from "@opentelemetry/api";
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  SEMATTRS_HTTP_URL,
  ATTR_HTTP_ROUTE,
} from "@opentelemetry/semantic-conventions";

export type OtelInitOpts = {
  name?: string;
};

export const init = (opts?: OtelInitOpts) => {
  const { name = "midwinter" } = opts ?? {};

  const otel = () => {
    const tracer = trace.getTracer(name);

    return new Midwinter().use((req, _, meta) => {
      return tracer.startActiveSpan("request", (span) => {
        return (res: Response) => {
          span.setAttributes({
            [SEMATTRS_HTTP_URL]: res.url,
            [ATTR_HTTP_REQUEST_METHOD]: req.method,
            [ATTR_HTTP_RESPONSE_STATUS_CODE]: res.status,
          });

          if (typeof meta.path === "string") {
            span.setAttribute(ATTR_HTTP_ROUTE, meta.path);
          }

          span.end();
        };
      });
    });
  };

  return { otel };
};
