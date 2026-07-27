/** Validates upstream responses and enforces their streamed byte limit. */

import type { IncomingMessage } from "node:http";

export const MAX_RESPONSE_BYTES = 10 * 1024 * 1024;

/** Destroys a rejected response stream before propagating its validation error. */
function rejectResponse(response: IncomingMessage, error: Error): never {
  response.destroy();
  throw error;
}

/** Rejects declared bodies that exceed the configured upstream byte limit. */
function contentLengthError(rawLength: string | undefined): Error | undefined {
  const contentLength = Number(rawLength || "0");
  if (!Number.isSafeInteger(contentLength)) return new Error("Invalid response Content-Length");
  if (contentLength < 0) return new Error("Invalid response Content-Length");
  if (contentLength > MAX_RESPONSE_BYTES) return new Error(`Response too large: ${contentLength} bytes`);
  return undefined;
}

/** Rejects failed or oversized upstream responses before their bodies are consumed. */
export function assertSuccessfulResponse(response: IncomingMessage): void {
  const status = response.statusCode ?? 0;
  if (Math.trunc(status / 100) !== 2) rejectResponse(response, new Error(`HTTP ${status}`));

  const rawEncoding = response.headers["content-encoding"];
  const contentEncoding = rawEncoding ? rawEncoding.trim().toLowerCase() : "identity";
  if (contentEncoding !== "identity") rejectResponse(response, new Error("Unexpected response Content-Encoding"));

  const lengthError = contentLengthError(response.headers["content-length"]);
  if (lengthError) rejectResponse(response, lengthError);
}
