/** Builds shared response headers for public data routes. */

type DegradedData = { _degraded?: boolean };

export function publicDataHeaders(data: DegradedData): Record<string, string> {
  return {
    ...(data._degraded ? { "x-data-degraded": "true" } : {}),
    ...(process.env.PUBLIC_EVENTS_MODE === "mock" ? { "x-data-mode": "mock" } : {})
  };
}
