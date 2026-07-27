/** Enforces optional bearer-token protection for BFF requests. */

import type { IncomingMessage, ServerResponse } from "node:http";
import { sendError } from "../utils/errors";
import { setRequestIdHeader } from "../utils/requestId";

const AUTH_REQUIRED_VALUES = new Set(["1", "true", "yes", "on"]);
const AUTH_DISABLED_VALUES = new Set(["0", "false", "no", "off"]);

/** Normalizes supported truthy and falsy settings while preserving an invalid state. */
function parseAuthRequirement(value: string | undefined): AuthRequirement {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "disabled";
  if (AUTH_REQUIRED_VALUES.has(normalized)) return "required";
  if (AUTH_DISABLED_VALUES.has(normalized)) return "disabled";
  return "invalid";
}

/** Extracts and trims a Bearer credential, returning empty text for malformed headers. */
function getBearerToken(req: IncomingMessage): string {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return "";
  }
  return authHeader.slice("Bearer ".length).trim();
}

/** Adds the ingress request ID before sending a stable authentication error payload. */
function sendAuthError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
  requestId?: string
): void {
  if (requestId) setRequestIdHeader(res, requestId);
  sendError(res, status, code, message);
}

type AuthRequirement = "disabled" | "required" | "invalid";

/**
 * Validates the deployment-time bearer-auth configuration.
 *
 * The request guard intentionally repeats this validation so a process remains
 * fail-closed if its environment is changed after startup.
 */
/** Fails startup when optional authentication is configured incompletely. */
export function validateAuthConfiguration(env: NodeJS.ProcessEnv = process.env): void {
  const authRequirement = parseAuthRequirement(env.BFF_REQUIRE_AUTH);
  if (authRequirement === "invalid") {
    throw new Error("BFF_REQUIRE_AUTH has an invalid value");
  }

  if (authRequirement === "required" && !env.BFF_AUTH_TOKEN?.trim()) {
    throw new Error("BFF_AUTH_TOKEN is required when BFF_REQUIRE_AUTH enables authentication");
  }
}

/** Whether this request should consume the invalid-credential rate-limit bucket. */
export function isInvalidAuthAttempt(
  req: IncomingMessage,
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (parseAuthRequirement(env.BFF_REQUIRE_AUTH) !== "required") return false;
  const expectedToken = env.BFF_AUTH_TOKEN?.trim();
  return expectedToken ? getBearerToken(req) !== expectedToken : false;
}

/** Rejects unauthenticated requests when bearer-token protection is enabled. */
export function guardAuth(
  req: IncomingMessage,
  res: ServerResponse,
  requestId?: string
): boolean {
  const authRequirement = parseAuthRequirement(process.env.BFF_REQUIRE_AUTH);
  if (authRequirement === "disabled") return true;
  if (authRequirement === "invalid") {
    sendAuthError(res, 500, "auth_misconfigured", "BFF_REQUIRE_AUTH has an invalid value", requestId);
    return false;
  }

  const expectedToken = process.env.BFF_AUTH_TOKEN?.trim();
  if (!expectedToken) {
    // Fail closed for private forks: enabling auth without a token is a
    // deployment error, not a reason to serve public data unauthenticated.
    sendAuthError(
      res,
      500,
      "auth_misconfigured",
      "Authentication is required but no token is configured",
      requestId
    );
    return false;
  }

  const bearerToken = getBearerToken(req);
  if (bearerToken === expectedToken) {
    return true;
  }

  sendAuthError(res, 401, "unauthorized", "Authentication required", requestId);
  return false;
}
