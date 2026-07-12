import type { IncomingMessage, ServerResponse } from "node:http";
import type { InstitutionPack } from "./config/loader";
import http from "node:http";
import { loadInstitutionPack } from "./config/loader";
import { guardAuth } from "./middleware/authGuard";
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

const DATA_ROUTES: Record<string, (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack) => Promise<void>> = {
  "/events": handleEvents,
  "/rooms": handleRooms,
  "/schedule": handleSchedule,
  "/today": handleToday
};

function getDataRouteHandler(
  pathname: string
): ((req: IncomingMessage, res: ServerResponse, institution: InstitutionPack) => Promise<void>) | undefined {
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

function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  const cors = getCorsHeaders(req.headers.origin, BFF_ENV.corsOrigins);
  for (const [key, value] of Object.entries(cors)) {
    res.setHeader(key, value);
  }
}

function loadInstitutionForRequest(res: ServerResponse, requestId: string): InstitutionPack | undefined {
  try {
    return loadInstitutionPack(BFF_ENV.institutionId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log("error", "institution_load_failed", {
      requestId,
      message,
      stack: err instanceof Error ? err.stack : undefined
    });
    setRequestIdHeader(res, requestId);

    if (message.includes("Unknown institutionId")) {
      sendError(res, 404, "institution_not_found", "The requested institution is not configured");
      return undefined;
    }
    sendError(res, 500, "internal_error", "An internal error occurred while loading configuration");
    return undefined;
  }
}

async function handleDataRoute(
  dataHandler: (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack) => Promise<void>,
  req: IncomingMessage,
  res: ServerResponse,
  requestId: string,
  path: string,
  startedAt: number
): Promise<void> {
  const institution = loadInstitutionForRequest(res, requestId);
  if (!institution) {
    return;
  }

  res.setHeader("x-institution-id", institution.id);
  await dataHandler(req, res, institution);
  log("info", "data_route_ok", { requestId, path, durationMs: Date.now() - startedAt });
}

function handleOptionsRequest(res: ServerResponse, requestId: string): void {
  setRequestIdHeader(res, requestId);
  res.setHeader("Allow", "GET, OPTIONS");
  res.writeHead(204);
  res.end();
}

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

function handleNotFound(res: ServerResponse, requestId: string, startedAt: number): void {
  setRequestIdHeader(res, requestId);
  sendError(res, 404, "not_found", "Route not found");
  log("info", "not_found", { requestId, durationMs: Date.now() - startedAt });
}

async function handleHealthRoute(req: IncomingMessage, res: ServerResponse, requestId: string, startedAt: number): Promise<void> {
  setRequestIdHeader(res, requestId);
  await handleHealth(req, res);
  log("info", "health_ok", { requestId, durationMs: Date.now() - startedAt });
}

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

async function dispatchRequest(
  req: IncomingMessage,
  res: ServerResponse,
  requestId: string,
  startedAt: number
): Promise<void> {
  const url = parseRequestUrl(req, res, requestId);
  if (!url) return;

  applyCorsHeaders(req, res);
  guardSecurityHeaders(req, res);

  if (req.method === "OPTIONS") {
    handleOptionsRequest(res, requestId);
    return;
  }

  if (!guardAuth(req, res, requestId)) {
    log("info", "auth_required", { requestId, method: req.method, path: url.pathname });
    return;
  }

  const rate = checkRateLimit(getClientKey(req, { trustProxy: BFF_ENV.trustProxy }));
  if (!rate.allowed) {
    handleRateLimitExceeded(res, requestId, url.pathname, rate.retryAfter);
    return;
  }

  if (!guardMethods(req, res, ALLOWED_METHODS, requestId)) {
    log("info", "method_not_allowed", { requestId, method: req.method, path: url.pathname });
    return;
  }

  const dataHandler = getDataRouteHandler(url.pathname);
  if (dataHandler) {
    await handleDataRoute(dataHandler, req, res, requestId, url.pathname, startedAt);
    return;
  }

  if (url.pathname === "/health") {
    await handleHealthRoute(req, res, requestId, startedAt);
    return;
  }

  handleNotFound(res, requestId, startedAt);
}

export function createRequestListener(): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res): Promise<void> => {
    const startedAt = Date.now();
    const requestId = getRequestId(req);

    try {
      await dispatchRequest(req, res, requestId, startedAt);
    } catch (handlerErr: unknown) {
      handleListenerError(res, requestId, handlerErr);
    }
  };
}

export async function startServer(): Promise<void> {
  log("info", "server_starting", {
    port: BFF_ENV.port,
    institutionId: BFF_ENV.institutionId
  });

  try {
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
    // eslint-disable-next-line no-console
    console.log(`BFF listening on http://localhost:${BFF_ENV.port}`);
  });
}

function isEntrypoint(): boolean {
  const entry = process.argv[1];
  return entry ? ["server.ts", "server.js"].includes(basename(entry)) : false;
}

if (isEntrypoint()) {
  void startServer();
}
