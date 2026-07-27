/** Serializes consistent typed error responses without exposing internals. */

import type { ServerResponse } from "node:http";
import {
  httpStatusForKind,
  createAppError,
  type AppError,
  type ErrorKindValue
} from "@concourse/shared";
import { log } from "./logger";

export type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

/** Sends a stable public error payload without serializing the originating exception. */
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

/** Maps a shared error kind to its public HTTP status and payload. */
export function sendTypedError(
  res: ServerResponse,
  kind: ErrorKindValue,
  code: string,
  message: string
): void {
  const appError: AppError = createAppError(kind, code, message);
  sendError(res, httpStatusForKind(kind), appError.code, appError.message);
}
