import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";

export function sendJsonWithCache(
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  options?: { status?: number; maxAgeSeconds?: number }
): void {
  let json: string;
  try {
    json = JSON.stringify(body);
  } catch {
    throw new Error("Response body is not JSON-serializable");
  }

  const status = options?.status ?? 200;
  const maxAgeSeconds = options?.maxAgeSeconds ?? 300;
  // Using 'md5' as it is generally faster than 'sha1' and sufficient for ETags.
  // In Node.js, we could also use a faster non-cryptographic hash if available as a dependency.
  const etag = `"${createHash("md5").update(json).digest("hex")}"`;

  if (res.headersSent) return;

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
