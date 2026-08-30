import type { IncomingMessage, ServerResponse } from "node:http";
import { ZodError, type z } from "zod";
import { InvalidQueryParameterError, NoConfiguredSourcesError } from "../application/errors";
import type { InstitutionPack } from "../runtime/institution";
import { log } from "../runtime/logger";
import { ResponseBodyTooLargeError, sendJsonWithCache } from "./cacheResponse";
import { ErrorKind, sendTypedError } from "./errors";
import { getRequestId, setRequestIdHeader } from "./requestId";

type JsonRouteLoader = (institution: InstitutionPack, req: IncomingMessage) => Promise<unknown>;

function sendExpectedRouteError(res: ServerResponse, requestId: string, error: Error): boolean {
  if (error instanceof NoConfiguredSourcesError) {
    log("warn", "no_config_sources", { requestId, message: error.message });
    sendTypedError(res, ErrorKind.NOT_FOUND, "not_found", error.message);
    return true;
  }

  if (error instanceof InvalidQueryParameterError) {
    log("warn", "invalid_query_param", { requestId, message: error.message });
    sendTypedError(res, ErrorKind.VALIDATION, "bad_request", error.message);
    return true;
  }

  return false;
}

const TIMEOUT_ERROR_NAMES = new Set(["AbortError", "TimeoutError", "RequestTimeoutError"]);

function sendTimeoutRouteError(res: ServerResponse, requestId: string, error: Error): boolean {
  const normalizedMessage = error.message.toLowerCase();
  const isTimeout = TIMEOUT_ERROR_NAMES.has(error.name) || normalizedMessage.includes("timeout") || normalizedMessage.includes("timed out");
  if (!isTimeout) return false;
  log("error", "route_timeout", { requestId, message: error.message });
  sendTypedError(res, ErrorKind.TIMEOUT, "timeout", "The request took too long. Please check your connection and try again.");
  return true;
}

function sendResponseBudgetRouteError(res: ServerResponse, requestId: string, error: Error): boolean {
  if (!(error instanceof ResponseBodyTooLargeError)) return false;
  log("error", "route_response_too_large", { requestId });
  sendTypedError(res, ErrorKind.UPSTREAM, "response_too_large", "The upstream response was too large. Please try again later.");
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
  if (sendResponseBudgetRouteError(res, requestId, error)) return;

  log("error", "route_error", { requestId });
  sendTypedError(res, ErrorKind.INTERNAL, "internal_error", "Something went wrong on our end. Please try again in a moment.");
}

export function createJsonRoute<T>(
  loader: JsonRouteLoader,
  schema: z.ZodType<T>,
  options: { maxAgeSeconds?: number; getExtraHeaders?: (data: T) => Record<string, string> } = {}
): (req: IncomingMessage, res: ServerResponse, institution: InstitutionPack, requestId?: string) => Promise<void> {
  const maxAgeSeconds = options.maxAgeSeconds ?? 300;
  const getExtraHeaders = options.getExtraHeaders;

  return async (req, res, institution, ingressRequestId?: string): Promise<void> => {
    // Direct route tests may omit the fourth argument; listener-dispatched
    // requests receive the single ID created at ingress.
    const requestId = ingressRequestId ?? getRequestId(req);
    setRequestIdHeader(res, requestId);
    try {
      const data = await loader(institution, req);
      const response = schema.parse(data);

      const headers = getExtraHeaders?.(response);
      sendJsonWithCache(req, res, response, { maxAgeSeconds, headers });
    } catch (err: unknown) {
      handleJsonRouteError(res, requestId, err);
    }
  };
}
