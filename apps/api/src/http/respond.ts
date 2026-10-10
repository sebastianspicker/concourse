/** Writes stable JSON, error, caching, and request-ID responses; depends on no other internal module. */

import { createHash, randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { PublicResponseHeader, type ErrorResponse } from "@concourse/contracts";

/** Largest UTF-8 JSON document this public API will send in one response. */
export const MAX_JSON_RESPONSE_BYTES = 4 * 1024 * 1024;

export class ResponseBodyTooLargeError extends Error {
  constructor() {
    super("JSON response exceeded the maximum size");
    this.name = "ResponseBodyTooLargeError";
  }
}

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

/** Sends the stable error envelope and reports false when headers were already committed. */
export function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string
): boolean {
  if (res.headersSent) {
    try {
      if (!res.writableEnded) res.end();
    } catch {
      // The socket may already be closed; the original error response remains authoritative.
    }
    return false;
  }

  const body: ErrorResponse = {
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
  return true;
}

export function sendJsonWithCache(
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  options?: { status?: number; maxAgeSeconds?: number; headers?: Record<string, string> }
): void {
  let json: string;
  try {
    json = JSON.stringify(body);
  } catch {
    throw new Error("Response body is not JSON-serializable");
  }
  if (Buffer.byteLength(json, "utf8") > MAX_JSON_RESPONSE_BYTES) throw new ResponseBodyTooLargeError();

  const status = options?.status ?? 200;
  const maxAgeSeconds = options?.maxAgeSeconds ?? 300;
  // ETags require deterministic equality only; this hash is not used for security.
  const etag = `"${createHash("md5").update(json).digest("hex")}"`;

  if (res.headersSent) return;

  for (const [key, value] of Object.entries(options?.headers ?? {})) {
    res.setHeader(key, value);
  }
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", `private, max-age=${maxAgeSeconds}`);

  const ifNoneMatch = req.headers?.["if-none-match"];
  if (ifNoneMatch) {
    // HTTP spec: If-None-Match can contain comma-separated ETags, possibly with W/ prefix
    const clientEtags = ifNoneMatch.split(",").map(t => t.trim().replace(/^W\//, ""));
    const bareEtag = etag.replace(/^W\//, "");
    if (clientEtags.includes(bareEtag)) {
      res.writeHead(304);
      res.end();
      return;
    }
  }

  res.writeHead(status, { "content-type": "application/json" });
  res.end(json);
}

/** Rejects methods outside the allowed list with a 405 and an Allow header. */
export function guardMethods(
  req: IncomingMessage,
  res: ServerResponse,
  allowed: string[] = ["GET", "OPTIONS"]
): boolean {
  const method = req.method ?? "GET";

  if (allowed.includes(method)) {
    return true;
  }

  res.setHeader("Allow", allowed.join(", "));
  sendError(res, 405, "method_not_allowed", "Method not allowed");
  return false;
}
