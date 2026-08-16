/** Implements timeout-aware JSON fetches and defensive fallback parsing of BFF failures. */
import { raceWithAbort } from "@concourse/shared";
import { getApiErrorDetails } from "../api/errors";
import { parseRetryAfterSeconds } from "./retryAfter";

export type BffError = {
  code: string;
  message: string;
};

/** Preserves non-success HTTP status, BFF code, and optional Retry-After guidance for callers. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterInSeconds: number | undefined;

  /** Captures the HTTP status, machine-readable code, and optional server retry guidance. */
  constructor(opts: { message: string; status: number; code: string; retryAfterInSeconds?: number }) {
    super(opts.message);
    this.name = "HttpError";
    this.status = opts.status;
    this.code = opts.code;
    this.retryAfterInSeconds = opts.retryAfterInSeconds;
  }
}

/** A timeout initiated by this client, distinct from a caller cancellation. */
export class RequestTimeoutError extends Error {
  /** Creates the distinct error used when the configured request deadline expires. */
  constructor() {
    super("Request timed out");
    this.name = "RequestTimeoutError";
  }
}

export type JsonResponse<T> = {
  data: T;
  headers: Headers;
};

type TimedRequest = {
  signal: AbortSignal;
  didTimeout: () => boolean;
  cleanup: () => void;
};

/** Rejects malformed, non-HTTP, or credential-bearing BFF URLs before a client request starts. */
function assertClientHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid BFF URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("BFF URL must use http or https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("BFF URL must not include credentials");
  }
}

/** Fetches JSON through the deadline-aware response reader and returns only its payload. */
export async function fetchJsonWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<T> {
  const response = await fetchJsonResponseWithTimeout<T>(url, init, timeoutMs);
  return response.data;
}

/** Fetches and validates a JSON response while respecting caller cancellation and a hard timeout. */
export async function fetchJsonResponseWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<JsonResponse<T>> {
  assertClientHttpUrl(url);
  const request = createTimedRequest(init?.signal, timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: request.signal, redirect: "error" });
    return await parseJsonResponse<T>(response, request.signal);
  } catch (error: unknown) {
    // Keep the timeout semantic through response-body reads as well as the
    // initial header fetch. Caller cancellations remain AbortError.
    if (request.didTimeout()) throw new RequestTimeoutError();
    throw error;
  } finally {
    request.cleanup();
  }
}

/** Creates the independently abortable deadline signal used for one client request. */
function createTimedRequest(externalSignal: AbortSignal | null | undefined, timeoutMs: number): TimedRequest {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const unlinkAbortSignals = linkAbortSignals(controller, externalSignal);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      unlinkAbortSignals();
      clearTimeout(timeoutId);
    }
  };
}

/** Validates a response and returns its parsed JSON while preserving its headers. */
async function parseJsonResponse<T>(response: Response, signal: AbortSignal): Promise<JsonResponse<T>> {
  if (!response.ok) {
    throw await createHttpError(response, signal);
  }

  return {
    data: await parseJsonBody<T>(response, signal),
    headers: response.headers
  };
}

/** Builds the normalized HTTP failure consumed by retry and UI error handling. */
async function createHttpError(response: Response, signal: AbortSignal): Promise<HttpError> {
  const bffError = await parseBffError(response, signal);
  const message = bffError.code === "unknown_error"
    ? `Request failed (${response.status})`
    : bffError.message;

  return new HttpError({
    message,
    status: response.status,
    code: bffError.code,
    retryAfterInSeconds: parseRetryAfterSeconds(response.headers.get("retry-after"))
  });
}

/** Reads successful response bodies while preserving empty and no-content response semantics. */
async function parseJsonBody<T>(response: Response, signal: AbortSignal): Promise<T> {
  // Some BFF responses intentionally have no body; callers still expect an
  // object-shaped value so schema parsing can decide what to do next.
  if (response.status === 204) {
    return {} as T;
  }

  const text = await abortableResponseRead(response.text(), signal);
  return text ? JSON.parse(text) as T : {} as T;
}

/** Races a response-body read against caller cancellation and cleans up its listener. */
function abortableResponseRead<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  const createAbortError = () => Object.assign(new Error("Aborted"), { name: "AbortError" });
  return raceWithAbort(promise, signal, createAbortError);
}

/** Safely extracts a BFF error payload, falling back when an error body is malformed. */
export async function parseBffError(response: Response, signal?: AbortSignal): Promise<BffError> {
  try {
    const read = response.json();
    const body: unknown = signal ? await abortableResponseRead(read, signal) : await read;
    return getApiErrorDetails(body, "Unknown error");
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    // Non-JSON error pages still map to the generic client error below.
  }

  return { code: "unknown_error", message: "Unknown error" };
}

/** Propagates external cancellation into the request controller and returns listener cleanup. */
function linkAbortSignals(
  controller: AbortController,
  external?: AbortSignal | null
): () => void {
  if (!external) {
    return () => undefined;
  }

  if (external.aborted) {
    controller.abort();
    return () => undefined;
  }

  const onAbort = () => controller.abort();
  external.addEventListener("abort", onAbort, { once: true });

  return () => external.removeEventListener("abort", onAbort);
}
