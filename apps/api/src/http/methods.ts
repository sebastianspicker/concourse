import type { IncomingMessage, ServerResponse } from "node:http";
import { sendError } from "./errors";
import { setRequestIdHeader } from "./requestId";

export function guardMethods(
  req: IncomingMessage,
  res: ServerResponse,
  allowed: string[] = ["GET", "OPTIONS"],
  requestId?: string
): boolean {
  const method = req.method ?? "GET";

  if (allowed.includes(method)) {
    return true;
  }

  if (requestId) setRequestIdHeader(res, requestId);
  res.setHeader("Allow", allowed.join(", "));
  sendError(res, 405, "method_not_allowed", "Method not allowed");
  return false;
}
