/** Applies baseline browser security headers to BFF responses. */

import type { IncomingMessage, ServerResponse } from "node:http";

/** Sets restrictive browser headers because BFF responses contain data, not executable content. */
export function guardSecurityHeaders(
  _req: IncomingMessage,
  res: ServerResponse
): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; sandbox");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}
