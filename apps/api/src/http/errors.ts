import type { ServerResponse } from "node:http";
import type { ErrorResponse } from "@concourse/contracts";
import { log } from "../runtime/logger";

export const ErrorKind = {
  NOT_FOUND: "not_found",
  VALIDATION: "validation",
  UPSTREAM: "upstream",
  RATE_LIMITED: "rate_limited",
  INTERNAL: "internal",
  TIMEOUT: "timeout",
} as const;

export type ErrorKindValue = (typeof ErrorKind)[keyof typeof ErrorKind];

const STATUS_BY_KIND: Record<ErrorKindValue, number> = {
  [ErrorKind.NOT_FOUND]: 404,
  [ErrorKind.VALIDATION]: 400,
  [ErrorKind.UPSTREAM]: 502,
  [ErrorKind.RATE_LIMITED]: 429,
  [ErrorKind.INTERNAL]: 500,
  [ErrorKind.TIMEOUT]: 504,
};

export type ErrorBody = ErrorResponse;

export function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string
): void {
  if (res.headersSent) {
    log("warn", "send_error_after_headers", { status, code, message });
    try {
      if (!res.writableEnded) res.end();
    } catch {
      // The socket may already be closed; the original error response remains authoritative.
    }
    return;
  }

  const body: ErrorBody = {
    error: {
      code,
      message
    }
  };

  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body));
}

export function sendTypedError(
  res: ServerResponse,
  kind: ErrorKindValue,
  code: string,
  message: string
): void {
  sendError(res, STATUS_BY_KIND[kind], code, message);
}
