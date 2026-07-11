import type { IncomingMessage, ServerResponse } from "node:http";
import type { z } from "zod";
import { ZodError } from "zod";
import { ErrorKind } from "@campus/shared";
import type { InstitutionPack } from "../config/loader";
import { sendJsonWithCache } from "../utils/httpCache";
import { sendTypedError } from "../utils/errors";
import { log } from "../utils/logger";
import { getRequestId } from "../utils/requestId";

type JsonRouteLoader = (institution: InstitutionPack, req: IncomingMessage) => Promise<unknown>;

const NO_CONFIG_SOURCES_PREFIX = "NO_CONFIG_SOURCES:";
const INVALID_QUERY_PARAM_PREFIX = "INVALID_QUERY_PARAM:";

function applyExtraHeaders<T>(res: ServerResponse, data: T, getExtraHeaders?: (data: T) => Record<string, string>): void {
  if (!getExtraHeaders) return;
  const extra = getExtraHeaders(data);
  for (const [key, value] of Object.entries(extra)) {
    res.setHeader(key, value);
  }
}

function sendExpectedRouteError(res: ServerResponse, requestId: string, error: Error): boolean {
  if (error.message.startsWith(NO_CONFIG_SOURCES_PREFIX)) {
    log("warn", "no_config_sources", { requestId, message: error.message });
    sendTypedError(res, ErrorKind.NOT_FOUND, "not_found", error.message.replace(NO_CONFIG_SOURCES_PREFIX, "").trim());
    return true;
  }

  if (error.message.startsWith(INVALID_QUERY_PARAM_PREFIX)) {
    log("warn", "invalid_query_param", { requestId, message: error.message });
    sendTypedError(res, ErrorKind.VALIDATION, "bad_request", error.message.replace(INVALID_QUERY_PARAM_PREFIX, "").trim());
    return true;
  }

  return false;
}

const TIMEOUT_ERROR_NAME = "AbortError";

function sendTimeoutRouteError(res: ServerResponse, requestId: string, error: Error): boolean {
  const isTimeout = error.name === TIMEOUT_ERROR_NAME || error.message.toLowerCase().includes("timeout");
  if (!isTimeout) return false;
  log("error", "route_timeout", { requestId, message: error.message });
  sendTypedError(res, ErrorKind.TIMEOUT, "timeout", "The request took too long. Please check your connection and try again.");
  return true;
}

const VALIDATION_ERROR_CODE = "validation_error";

function handleJsonRouteError(res: ServerResponse, requestId: string, err: unknown): void {
  if (err instanceof ZodError) {
    log("warn", VALIDATION_ERROR_CODE, { requestId, issues: err.issues });
    sendTypedError(res, ErrorKind.INTERNAL, VALIDATION_ERROR_CODE, "The server received an unexpected data format. Please try again later.");
    return;
  }

  const error = err instanceof Error ? err : new Error(String(err));
  if (sendExpectedRouteError(res, requestId, error)) return;
  if (sendTimeoutRouteError(res, requestId, error)) return;

  log("error", "route_error", {
    requestId,
    message: error.message,
    stack: error.stack
  });
  sendTypedError(res, ErrorKind.INTERNAL, "internal_error", "Something went wrong on our end. Please try again in a moment.");
}

export function createJsonRoute<T>(
  loader: JsonRouteLoader,
  schema: z.ZodType<T>,
  options: { maxAgeSeconds?: number; getExtraHeaders?: (data: T) => Record<string, string> } = {}
): (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack) => Promise<void> {
  const maxAgeSeconds = options.maxAgeSeconds ?? 300;
  const getExtraHeaders = options.getExtraHeaders;

  return async (req, res, institution): Promise<void> => {
    const requestId = getRequestId(req);
    try {
      const data = await loader(institution, req);
      const response = schema.parse(data);

      res.setHeader("x-request-id", requestId);
      applyExtraHeaders(res, response, getExtraHeaders);
      sendJsonWithCache(req, res, response, { maxAgeSeconds });
    } catch (err: unknown) {
      handleJsonRouteError(res, requestId, err);
    }
  };
}
