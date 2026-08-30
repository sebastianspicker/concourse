import { PublicResponseHeader } from "@concourse/contracts";

type DegradedData = { _degraded?: boolean };

export function publicDataHeaders(data: DegradedData): Record<string, string> {
  return {
    ...(data._degraded ? { [PublicResponseHeader.dataDegraded]: "true" } : {}),
    ...(process.env.PUBLIC_EVENTS_MODE === "mock" ? { [PublicResponseHeader.dataMode]: "mock" } : {})
  };
}
