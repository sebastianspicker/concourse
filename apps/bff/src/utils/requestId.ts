/** Validates or creates request IDs and attaches them to responses. */

import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

/** Accepts only bounded printable request IDs before echoing them to logs and clients. */
function normalizeRequestId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(trimmed)) return null;
  return trimmed;
}

/** Reuses a valid ingress request ID or creates a safe replacement identifier. */
export function getRequestId(req: IncomingMessage): string {
  const header = req.headers?.["x-request-id"];
  const candidate = Array.isArray(header) ? header[0] : header;
  return normalizeRequestId(candidate) ?? randomUUID();
}

/** Propagates the validated request ID to clients for error and log correlation. */
export function setRequestIdHeader(
  res: ServerResponse,
  requestId: string
): void {
  if (!res.headersSent) res.setHeader("x-request-id", requestId);
}
