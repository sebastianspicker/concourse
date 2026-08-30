import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";

/** Largest UTF-8 JSON document this public API will send in one response. */
export const MAX_JSON_RESPONSE_BYTES = 4 * 1024 * 1024;

export class ResponseBodyTooLargeError extends Error {
  constructor() {
    super("JSON response exceeded the maximum size");
    this.name = "ResponseBodyTooLargeError";
  }
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
