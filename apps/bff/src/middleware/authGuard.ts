import type { IncomingMessage, ServerResponse } from "node:http";
import { sendError } from "../utils/errors";
import { setRequestIdHeader } from "../utils/requestId";

type AuthRequirement = "disabled" | "required" | "invalid";

const AUTH_REQUIRED_VALUES = new Set(["1", "true", "yes", "on"]);
const AUTH_DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

export function guardAuth(
  req: IncomingMessage,
  res: ServerResponse,
  requestId?: string
): boolean {
  const authRequirement = parseAuthRequirement(process.env.BFF_REQUIRE_AUTH);
  if (authRequirement === "disabled") return true;
  if (authRequirement === "invalid") {
    if (requestId) setRequestIdHeader(res, requestId);
    sendError(res, 500, "auth_misconfigured", "BFF_REQUIRE_AUTH has an invalid value");
    return false;
  }

  const expectedToken = process.env.BFF_AUTH_TOKEN?.trim();
  if (!expectedToken) {
    // Fail closed for private forks: enabling auth without a token is a
    // deployment error, not a reason to serve public data unauthenticated.
    if (requestId) setRequestIdHeader(res, requestId);
    sendError(res, 500, "auth_misconfigured", "Authentication is required but no token is configured");
    return false;
  }

  const authHeader = req.headers["authorization"];
  const bearerToken = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (bearerToken === expectedToken) {
    return true;
  }

  if (requestId) setRequestIdHeader(res, requestId);
  sendError(res, 401, "unauthorized", "Authentication required");
  return false;
}

function parseAuthRequirement(value: string | undefined): AuthRequirement {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "disabled";
  if (AUTH_REQUIRED_VALUES.has(normalized)) return "required";
  if (AUTH_DISABLED_VALUES.has(normalized)) return "disabled";
  return "invalid";
}
