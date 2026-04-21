import type { IncomingMessage, ServerResponse } from "node:http";
import type { InstitutionPack } from "./config/loader";
import http from "node:http";
import { loadInstitutionPack } from "./config/loader";
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

const DATA_ROUTES: Record<string, (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack) => Promise<void>> = {
  "/events": handleEvents,
  "/rooms": handleRooms,
  "/schedule": handleSchedule,
  "/today": handleToday
};

export function createRequestListener(): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res): Promise<void> => {
    const startedAt = Date.now();
    const requestId = getRequestId(req);

    try {
      if (!req.url) {
        setRequestIdHeader(res, requestId);
        sendError(res, 400, "bad_request", "Missing URL");
        return;
      }

      let url: URL;
      try {
        url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
      } catch {
        setRequestIdHeader(res, requestId);
        sendError(res, 400, "bad_request", "Invalid request URL");
        return;
      }
      const cors = getCorsHeaders(req.headers.origin, BFF_ENV.corsOrigins);
      for (const [key, value] of Object.entries(cors)) {
        res.setHeader(key, value);
      }

      guardSecurityHeaders(req, res);

      if (req.method === "OPTIONS") {
        setRequestIdHeader(res, requestId);
        res.setHeader("Allow", "GET, OPTIONS");
        res.writeHead(204);
        res.end();
        return;
      }

      const clientKey = getClientKey(req, { trustProxy: BFF_ENV.trustProxy });
      const rate = checkRateLimit(clientKey);
      if (!rate.allowed) {
        setRequestIdHeader(res, requestId);
        res.setHeader("retry-after", String(rate.retryAfter));
        sendError(res, 429, "rate_limited", "Too many requests");
        log("warn", "rate_limited", {
          requestId,
          path: url.pathname,
          retryAfterSeconds: rate.retryAfter
        });
        return;
      }

      if (!guardMethods(req, res, ["GET", "OPTIONS"], requestId)) {
        log("info", "method_not_allowed", {
          requestId,
          method: req.method,
          path: url.pathname
        });
        return;
      }

      const dataHandler = DATA_ROUTES[url.pathname];
      if (dataHandler) {
        let institution: InstitutionPack;
        try {
          institution = await loadInstitutionPack(BFF_ENV.institutionId);
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
            return;
          }
          sendError(res, 500, "internal_error", "An internal error occurred while loading configuration");
          return;
        }
        await dataHandler(req, res, institution);
        log("info", "data_route_ok", { requestId, path: url.pathname, durationMs: Date.now() - startedAt });
        return;
      }

      if (url.pathname === "/health") {
        setRequestIdHeader(res, requestId);
        await handleHealth(req, res);
        log("info", "health_ok", { requestId, durationMs: Date.now() - startedAt });
        return;
      }

      setRequestIdHeader(res, requestId);
      sendError(res, 404, "not_found", "Route not found");
      log("info", "not_found", { requestId, durationMs: Date.now() - startedAt });
    } catch (handlerErr: unknown) {
      log("error", "handler_error", { requestId, message: handlerErr instanceof Error ? handlerErr.message : String(handlerErr), stack: handlerErr instanceof Error ? handlerErr.stack : undefined });
      setRequestIdHeader(res, requestId);
      sendError(res, 500, "internal_error", "Unexpected server error");
    }
  };
}

async function startServer(): Promise<void> {
  log("info", "server_starting", {
    port: BFF_ENV.port,
    institutionId: BFF_ENV.institutionId
  });

  try {
    // #55: Startup validation dry-run
    await loadInstitutionPack(BFF_ENV.institutionId);
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

void startServer();
