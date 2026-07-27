/** Composes the BFF HTTP listener, middleware, routes, and startup lifecycle. */

import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { loadInstitutionPack, type InstitutionPack } from "./config/loader";
import { guardAuth, isInvalidAuthAttempt, validateAuthConfiguration } from "./middleware/authGuard";
import { guardMethods } from "./middleware/methodGuard";
import { handleEvents } from "./routes/events";
import { handleHealth } from "./routes/health";
import { handleRooms } from "./routes/rooms";
import { handleSchedule } from "./routes/schedule";
import { handleToday } from "./routes/today";
import { getCorsHeaders } from "./utils/cors";
import { getClientKey } from "./utils/clientKey";
import { guardSecurityHeaders } from "./middleware/securityHeaders";
import { checkRateLimit } from "./utils/rateLimit";
import { sendError } from "./utils/errors";
import { log } from "./utils/logger";
import { getRequestId, setRequestIdHeader } from "./utils/requestId";
import { BFF_ENV } from "./config/env";
import { basename } from "node:path";

type DataRouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  institution: InstitutionPack,
  requestId?: string
) => Promise<void>;

type DataRouteContext = {
  dataHandler: DataRouteHandler;
  req: IncomingMessage;
  res: ServerResponse;
  requestId: string;
  path: string;
  startedAt: number;
};

type InstitutionLoadFailure = {
  status: number;
  code: string;
  publicMessage: string;
};

/** Normalizes thrown primitives so downstream logging can rely on Error fields. */
function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** Maps an unknown institution to 404 and other configuration failures to a sanitized 500. */
function getInstitutionLoadFailure(message: string): InstitutionLoadFailure {
  return message.includes("Unknown institutionId")
    ? {
        status: 404,
        code: "institution_not_found",
        publicMessage: "The requested institution is not configured"
      }
    : {
        status: 500,
        code: "internal_error",
        publicMessage: "An internal error occurred while loading configuration"
      };
}

/** Distinguishes successful data-route logs from completed non-success responses. */
function getDataRouteLogEvent(statusCode: number): "data_route_ok" | "data_route_complete" {
  return statusCode >= 200 && statusCode < 400 ? "data_route_ok" : "data_route_complete";
}

const DATA_ROUTES: Record<string, DataRouteHandler> = {
  "/events": handleEvents,
  "/rooms": handleRooms,
  "/schedule": handleSchedule,
  "/today": handleToday
};

/** Resolves only the four public data paths to handlers, leaving health and 404 routing separate. */
function getDataRouteHandler(
  pathname: string
): DataRouteHandler | undefined {
  switch (pathname) {
    case "/events":
      return DATA_ROUTES["/events"];
    case "/rooms":
      return DATA_ROUTES["/rooms"];
    case "/schedule":
      return DATA_ROUTES["/schedule"];
    case "/today":
      return DATA_ROUTES["/today"];
    default:
      return undefined;
  }
}

/** Parses a relative request URL or commits a request-ID-bearing 400 response. */
function parseRequestUrl(req: IncomingMessage, res: ServerResponse, requestId: string): URL | undefined {
  if (!req.url) {
    setRequestIdHeader(res, requestId);
    sendError(res, 400, "bad_request", "Missing URL");
    return undefined;
  }

  try {
    return new URL(req.url, "http://localhost");
  } catch {
    setRequestIdHeader(res, requestId);
    sendError(res, 400, "bad_request", "Invalid request URL");
    return undefined;
  }
}

/** Applies only CORS headers permitted by the deployment origin allowlist. */
function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const cors = getCorsHeaders(req.headers.origin, BFF_ENV.corsOrigins);
  Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
}

/** Loads the selected institution or converts configuration failures into public errors. */
function loadInstitutionForRequest(res: ServerResponse, requestId: string): InstitutionPack | undefined {
  try {
    return loadInstitutionPack(BFF_ENV.institutionId);
  } catch (err: unknown) {
    const error = normalizeError(err);
    log("error", "institution_load_failed", {
      requestId,
      message: error.message,
      stack: error.stack
    });
    setRequestIdHeader(res, requestId);
    const failure = getInstitutionLoadFailure(error.message);
    sendError(res, failure.status, failure.code, failure.publicMessage);
    return undefined;
  }
}

/** Adds institution identity, invokes the selected data route, and records its duration. */
async function handleDataRoute(context: DataRouteContext): Promise<void> {
  const { dataHandler, req, res, requestId, path, startedAt } = context;
  const institution = loadInstitutionForRequest(res, requestId);
  if (!institution) {
    return;
  }

  res.setHeader("x-institution-id", institution.id);
  await dataHandler(req, res, institution, requestId);
  const durationMs = Date.now() - startedAt;
  log("info", getDataRouteLogEvent(res.statusCode), { requestId, path, durationMs, statusCode: res.statusCode });
}

/** Completes a CORS preflight without entering authentication or data-loading paths. */
function handleOptionsRequest(res: ServerResponse, requestId: string): void {
  setRequestIdHeader(res, requestId);
  res.setHeader("Allow", "GET, OPTIONS");
  res.writeHead(204);
  res.end();
}

/** Sends a retryable 429 response with request identity and structured rate-limit logging. */
function handleRateLimitExceeded(res: ServerResponse, requestId: string, path: string, retryAfter: number): void {
  setRequestIdHeader(res, requestId);
  res.setHeader("retry-after", String(retryAfter));
  sendError(res, 429, "rate_limited", "Too many requests");
  log("warn", "rate_limited", {
    requestId,
    path,
    retryAfterSeconds: retryAfter
  });
}

/** Commits the stable 404 payload and records time spent before route resolution failed. */
function handleNotFound(res: ServerResponse, requestId: string, startedAt: number): void {
  setRequestIdHeader(res, requestId);
  sendError(res, 404, "not_found", "Route not found");
  log("info", "not_found", { requestId, durationMs: Date.now() - startedAt });
}

/** Runs the local health handler and records latency under the ingress request ID. */
async function handleHealthRoute(req: IncomingMessage, res: ServerResponse, requestId: string, startedAt: number): Promise<void> {
  setRequestIdHeader(res, requestId);
  await handleHealth(req, res);
  log("info", "health_ok", { requestId, durationMs: Date.now() - startedAt });
}

/** Logs an uncaught listener failure and ends the request with a sanitized 500 response. */
function handleListenerError(res: ServerResponse, requestId: string, handlerErr: unknown): void {
  log("error", "handler_error", {
    requestId,
    message: handlerErr instanceof Error ? handlerErr.message : String(handlerErr),
    stack: handlerErr instanceof Error ? handlerErr.stack : undefined
  });
  setRequestIdHeader(res, requestId);
  sendError(res, 500, "internal_error", "Unexpected server error");
}

const ALLOWED_METHODS = ["GET", "OPTIONS"];

/** Limits rejected authentication attempts separately from ordinary route traffic. */
const guardAuthAttemptRate = (req: IncomingMessage, res: ServerResponse, requestId: string, path: string, clientKey: string): boolean => {
  if (!isInvalidAuthAttempt(req)) return true;

  const authRate = checkRateLimit(`auth:${clientKey}`);
  if (authRate.allowed) return true;
  handleRateLimitExceeded(res, requestId, path, authRate.retryAfter);
  return false;
};

/** Applies method and authentication guards before a route can perform work. */
const guardRequestAccess = (req: IncomingMessage, res: ServerResponse, requestId: string, path: string): boolean => {
  const clientKey = getClientKey(req, {
    trustProxy: BFF_ENV.trustProxy,
    trustedProxyMatcher: BFF_ENV.trustedProxyMatcher
  });
  if (!guardAuthAttemptRate(req, res, requestId, path, clientKey)) return false;

  if (!guardAuth(req, res, requestId)) {
    log("info", "auth_required", { requestId, method: req.method, path });
    return false;
  }

  const requestRate = checkRateLimit(`request:${clientKey}`);
  if (!requestRate.allowed) {
    handleRateLimitExceeded(res, requestId, path, requestRate.retryAfter);
    return false;
  }

  if (!guardMethods(req, res, ALLOWED_METHODS, requestId)) {
    log("info", "method_not_allowed", { requestId, method: req.method, path });
    return false;
  }
  return true;
};

/** Dispatches a validated request while preserving request IDs and response ordering. */
const dispatchRequest = async (req: IncomingMessage, res: ServerResponse, requestId: string, startedAt: number): Promise<void> => {
  const url = parseRequestUrl(req, res, requestId);
  if (!url) return;

  applyCorsHeaders(req, res);
  guardSecurityHeaders(req, res);

  if (req.method === "OPTIONS") {
    handleOptionsRequest(res, requestId);
    return;
  }

  if (!guardRequestAccess(req, res, requestId, url.pathname)) return;

  const dataHandler = getDataRouteHandler(url.pathname);
  if (dataHandler) {
    await handleDataRoute({ dataHandler, req, res, requestId, path: url.pathname, startedAt });
    return;
  }

  if (url.pathname === "/health") {
    await handleHealthRoute(req, res, requestId, startedAt);
    return;
  }

  handleNotFound(res, requestId, startedAt);
};

/** Creates the complete BFF listener after validating startup-only configuration. */
export function createRequestListener(): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res): Promise<void> => {
    const startedAt = Date.now();
    const requestId = getRequestId(req);
    setRequestIdHeader(res, requestId);

    try {
      await dispatchRequest(req, res, requestId, startedAt);
    } catch (handlerErr: unknown) {
      handleListenerError(res, requestId, handlerErr);
    }
  };
}

/** Starts the configured HTTP listener and logs the resolved runtime settings. */
export async function startServer(): Promise<void> {
  log("info", "server_starting", {
    port: BFF_ENV.port,
    institutionId: BFF_ENV.institutionId
  });

  try {
    validateAuthConfiguration();
    loadInstitutionPack(BFF_ENV.institutionId);
    log("info", "startup_validation_ok");
  } catch (err: unknown) {
    log("error", "startup_validation_failed", {
      message: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }

  const server = http.createServer(createRequestListener());
  server.listen(BFF_ENV.port, () => {
    log("info", "server_listening", { port: BFF_ENV.port });
  });
}

/** Detects direct source or compiled execution without starting during imports and tests. */
function isEntrypoint(): boolean {
  const entry = process.argv[1];
  return entry ? ["server.ts", "server.js"].includes(basename(entry)) : false;
}

if (isEntrypoint()) {
  void startServer();
}
