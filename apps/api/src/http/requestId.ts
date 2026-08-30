import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { PublicResponseHeader } from "@concourse/contracts";

function normalizeRequestId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return null;
  if (!/^[A-Za-z0-9._:-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function getRequestId(req: IncomingMessage): string {
  const header = req.headers?.[PublicResponseHeader.requestId];
  const candidate = Array.isArray(header) ? header[0] : header;
  return normalizeRequestId(candidate) ?? randomUUID();
}

export function setRequestIdHeader(
  res: ServerResponse,
  requestId: string
): void {
  if (!res.headersSent) res.setHeader(PublicResponseHeader.requestId, requestId);
}
