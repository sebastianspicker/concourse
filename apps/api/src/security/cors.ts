/** Builds CORS headers only for explicitly allowed browser origins. */
import { PublicResponseHeader } from "@concourse/contracts";

/** Returns browser CORS headers only when the request origin matches an allowed origin. */
export function getCorsHeaders(
  requestOrigin: string | undefined,
  allowedOrigins: string[]
): Record<string, string> {
  if (allowedOrigins.length === 0) {
    return {};
  }

  // Note: when allowedOrigins includes "*", wildcard takes precedence and all
  // origins are allowed. Any specific origins in the list are ignored in that case.
  // This matches browser behavior where Access-Control-Allow-Origin: * means
  // credentials are not allowed regardless of other entries.
  const origin =
    allowedOrigins.includes("*")
      ? "*"
      : requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : null;

  if (!origin) {
    return {};
  }

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-expose-headers": [
      PublicResponseHeader.institutionId,
      PublicResponseHeader.requestId,
      PublicResponseHeader.dataDegraded,
      PublicResponseHeader.dataMode,
      PublicResponseHeader.retryAfter,
    ].join(", "),
    ...(origin === "*" ? {} : { vary: "origin" })
  };
}
