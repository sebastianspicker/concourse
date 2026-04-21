import type { IncomingMessage, ServerResponse } from "node:http";
import { sendError } from "../utils/errors";
import { setRequestIdHeader } from "../utils/requestId";

/**
 * Template Auth Guard.
 * In this public template, we only check for a placeholder Authorization header
 * to demonstrate how private forks can implement real authentication.
 */
export function guardAuth(
  req: IncomingMessage,
  res: ServerResponse,
  requestId?: string
): boolean {
  // Demo requirement: If a certain env var is set, require a header
  const requireAuth = process.env.BFF_REQUIRE_AUTH === "1";
  if (!requireAuth) return true;

  const authHeader = req.headers["authorization"];

  // Replace this with real token verification (e.g. JWT) in private forks
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return true;
  }

  if (requestId) setRequestIdHeader(res, requestId);
  sendError(res, 401, "unauthorized", "Authentication required");
  return false;
}
