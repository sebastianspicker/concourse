import type { IncomingMessage, ServerResponse } from "node:http";
import { PublicResponseHeader, PublicRoute, type PublicDataRoute } from "@concourse/contracts";
import { createDataRouteHandlers, handleEvents, handleRooms, handleSchedule, handleToday, type DataRouteHandlers } from "./dataRoutes";
import type { PublicDataSources } from "../application/publicSources";
import { sendError } from "./errors";
import { handleHealth } from "./health";
import { guardMethods } from "./methods";
import { getRequestId, setRequestIdHeader } from "./requestId";
import { loadInstitutionPack, type InstitutionPack } from "../runtime/institution";
import { BFF_ENV } from "../runtime/config";
import { log } from "../runtime/logger";
import { guardAuth, isInvalidAuthAttempt } from "../security/auth";
import { getClientKey } from "../security/clientIdentity";
import { getCorsHeaders } from "../security/cors";
import { guardSecurityHeaders } from "../security/headers";
import { checkRateLimit } from "../security/rateLimit";

type DataRouteHandler = (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack, requestId?: string) => Promise<void>;
type InstitutionLoader = (institutionId: string) => InstitutionPack;
type DataRouteContext = {
  dataHandler: DataRouteHandler;
  institutionLoader: InstitutionLoader;
  institutionId: string;
  req: IncomingMessage;
  res: ServerResponse;
  requestId: string;
  path: string;
  startedAt: number;
};
type InstitutionLoadFailure = { status: number; code: string; publicMessage: string };

export type RequestListenerDependencies = {
  publicDataSources?: PublicDataSources;
  now?: Date;
  institutionLoader?: InstitutionLoader;
};

type ResolvedListenerDependencies = {
  dataRoutes: DataRouteHandlers;
  institutionId: string;
  institutionLoader: InstitutionLoader;
};

const DATA_ROUTES: Record<PublicDataRoute, DataRouteHandler> = {
  [PublicRoute.events]: handleEvents,
  [PublicRoute.rooms]: handleRooms,
  [PublicRoute.schedule]: handleSchedule,
  [PublicRoute.today]: handleToday,
};
const ALLOWED_METHODS = ["GET", "OPTIONS"];

function normalizeError(error: unknown): Error { return error instanceof Error ? error : new Error(String(error)); }

function getInstitutionLoadFailure(message: string): InstitutionLoadFailure {
  return message.includes("Unknown institutionId")
    ? { status: 404, code: "institution_not_found", publicMessage: "The requested institution is not configured" }
    : { status: 500, code: "internal_error", publicMessage: "An internal error occurred while loading configuration" };
}

function resolveListenerDependencies(dependencies: RequestListenerDependencies): ResolvedListenerDependencies {
  const hasRouteOverrides = dependencies.publicDataSources !== undefined || dependencies.now !== undefined;
  return {
    dataRoutes: hasRouteOverrides
      ? createDataRouteHandlers({ publicDataSources: dependencies.publicDataSources, now: dependencies.now })
      : DATA_ROUTES,
    institutionId: BFF_ENV.institutionId,
    institutionLoader: dependencies.institutionLoader ?? loadInstitutionPack
  };
}

function parseRequestUrl(req: IncomingMessage, res: ServerResponse, requestId: string): URL | undefined {
  if (!req.url) {
    setRequestIdHeader(res, requestId);
    sendError(res, 400, "bad_request", "Missing URL");
    return undefined;
  }
  try { return new URL(req.url, "http://localhost"); } catch {
    setRequestIdHeader(res, requestId);
    sendError(res, 400, "bad_request", "Invalid request URL");
    return undefined;
  }
}

function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): void {
  for (const [key, value] of Object.entries(getCorsHeaders(req.headers.origin, BFF_ENV.corsOrigins))) res.setHeader(key, value);
}

function loadInstitutionForRequest(res: ServerResponse, requestId: string, institutionLoader: InstitutionLoader, institutionId: string): InstitutionPack | undefined {
  try { return institutionLoader(institutionId); } catch (err: unknown) {
    const error = normalizeError(err);
    log("error", "institution_load_failed", { requestId, message: error.message, stack: error.stack });
    setRequestIdHeader(res, requestId);
    const failure = getInstitutionLoadFailure(error.message);
    sendError(res, failure.status, failure.code, failure.publicMessage);
    return undefined;
  }
}

async function handleDataRoute(context: DataRouteContext): Promise<void> {
  const { dataHandler, institutionLoader, institutionId, req, res, requestId, path, startedAt } = context;
  const institution = loadInstitutionForRequest(res, requestId, institutionLoader, institutionId);
  if (!institution) return;
  res.setHeader(PublicResponseHeader.institutionId, institution.id);
  await dataHandler(req, res, institution, requestId);
  log("info", res.statusCode >= 200 && res.statusCode < 400 ? "data_route_ok" : "data_route_complete", {
    requestId, path, durationMs: Date.now() - startedAt, statusCode: res.statusCode
  });
}

function handleOptionsRequest(res: ServerResponse, requestId: string): void {
  setRequestIdHeader(res, requestId);
  res.setHeader("Allow", "GET, OPTIONS");
  res.writeHead(204);
  res.end();
}

function handleRateLimitExceeded(res: ServerResponse, requestId: string, path: string, retryAfter: number): void {
  setRequestIdHeader(res, requestId);
  res.setHeader(PublicResponseHeader.retryAfter, String(retryAfter));
  sendError(res, 429, "rate_limited", "Too many requests");
  log("warn", "rate_limited", { requestId, path, retryAfterSeconds: retryAfter });
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

function handleListenerError(res: ServerResponse, requestId: string, error: unknown): void {
  log("error", "handler_error", { requestId, message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
  setRequestIdHeader(res, requestId);
  sendError(res, 500, "internal_error", "Unexpected server error");
}

function guardRequestAccess(req: IncomingMessage, res: ServerResponse, requestId: string, path: string): boolean {
  const clientKey = getClientKey(req, { trustProxy: BFF_ENV.trustProxy, trustedProxyMatcher: BFF_ENV.trustedProxyMatcher });
  if (isInvalidAuthAttempt(req)) {
    const authRate = checkRateLimit(`auth:${clientKey}`);
    if (!authRate.allowed) { handleRateLimitExceeded(res, requestId, path, authRate.retryAfter); return false; }
  }
  if (!guardAuth(req, res, requestId)) { log("info", "auth_required", { requestId, method: req.method, path }); return false; }
  const requestRate = checkRateLimit(`request:${clientKey}`);
  if (!requestRate.allowed) { handleRateLimitExceeded(res, requestId, path, requestRate.retryAfter); return false; }
  if (!guardMethods(req, res, ALLOWED_METHODS, requestId)) { log("info", "method_not_allowed", { requestId, method: req.method, path }); return false; }
  return true;
}

async function dispatchRequest(
  req: IncomingMessage,
  res: ServerResponse,
  requestId: string,
  startedAt: number,
  dependencies: ResolvedListenerDependencies
): Promise<void> {
  const url = parseRequestUrl(req, res, requestId);
  if (!url) return;
  applyCorsHeaders(req, res);
  guardSecurityHeaders(req, res);
  if (req.method === "OPTIONS") { handleOptionsRequest(res, requestId); return; }
  if (!guardRequestAccess(req, res, requestId, url.pathname)) return;
  const dataHandler = Object.hasOwn(dependencies.dataRoutes, url.pathname)
    ? dependencies.dataRoutes[url.pathname as PublicDataRoute]
    : undefined;
  if (dataHandler) {
    await handleDataRoute({
      dataHandler,
      institutionLoader: dependencies.institutionLoader,
      institutionId: dependencies.institutionId,
      req,
      res,
      requestId,
      path: url.pathname,
      startedAt
    });
    return;
  }
  if (url.pathname === PublicRoute.health) { await handleHealthRoute(req, res, requestId, startedAt); return; }
  handleNotFound(res, requestId, startedAt);
}

export function createRequestListener(dependencies: RequestListenerDependencies = {}): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const resolvedDependencies = resolveListenerDependencies(dependencies);
  return async (req, res): Promise<void> => {
    const startedAt = Date.now();
    const requestId = getRequestId(req);
    setRequestIdHeader(res, requestId);
    try { await dispatchRequest(req, res, requestId, startedAt, resolvedDependencies); } catch (error: unknown) { handleListenerError(res, requestId, error); }
  };
}
