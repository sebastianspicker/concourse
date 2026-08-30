export const PublicResponseHeader = {
  dataDegraded: "x-data-degraded",
  dataMode: "x-data-mode",
  institutionId: "x-institution-id",
  requestId: "x-request-id",
  retryAfter: "retry-after",
} as const;

export type PublicResponseHeaderName = (typeof PublicResponseHeader)[keyof typeof PublicResponseHeader];
