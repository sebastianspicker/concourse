import type { IncomingMessage, ServerResponse } from "node:http";
import { sendError } from "../utils/errors";
import { setRequestIdHeader } from "../utils/requestId";

export function guardMethods(
  req: IncomingMessage,
  res: ServerResponse,
  allowed: string[] = ["GET", "OPTIONS"],
  requestId?: string
): boolean {
  // return true if allowed, false if responded with error
  const method = req.method ?? "GET";

  if (allowed.includes(method)) {
    return true;
  }

  if (requestId) setRequestIdHeader(res, requestId);
  res.setHeader("Allow", allowed.join(", "));
  sendError(res, 405, "method_not_allowed", "Method not allowed");
  return false;
}
