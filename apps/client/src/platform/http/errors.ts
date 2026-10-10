/** Defines normalized API failures and safely parses BFF error responses. */
export type ApiError = {
  code: string;
  message: string;
  status: number;
  retryAfterInSeconds?: number;
};

/** Carries the normalized BFF code and status through retry and UI error handling. */
export class ApiErrorException extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfterInSeconds: number | undefined;

  /** Preserves the normalized API code and status on a throwable error instance. */
  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.status = error.status;
    this.retryAfterInSeconds = error.retryAfterInSeconds;
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

/** Creates the error used to signal caller-requested cancellation. */
export function createAbortError(): Error {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

/** Recognizes caller-requested cancellation, which is never a user-visible failure. */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

const NON_RETRYABLE_ERROR_CODES = new Set(["institution_mismatch", "validation_error"]);

function isRetryableResponseError(error: ApiErrorException): boolean {
  return !NON_RETRYABLE_ERROR_CODES.has(error.code) && (error.status === 429 || error.status >= 500);
}

/** Identifies failures eligible for persisted fallback and automatic recovery. */
export function isTransientPublicDataFailure(error: unknown): boolean {
  if (error instanceof RequestTimeoutError || error instanceof TypeError) return true;
  if (error instanceof ApiErrorException) return isRetryableResponseError(error);
  return false;
}

/** Prevents automatic recovery loops for responses that require configuration or contract repair. */
export function isPublicDataRecoveryBlocked(error: unknown): boolean {
  return error instanceof ApiErrorException && NON_RETRYABLE_ERROR_CODES.has(error.code);
}

/** Narrows unknown API payloads to objects carrying the expected error member. */
function hasApiErrorEnvelope(body: unknown): body is { error: Record<string, unknown> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as Record<string, unknown>).error === "object" &&
    (body as Record<string, unknown>).error !== null
  );
}

/** Reads a stable code and message from an error envelope or returns caller-provided fallback copy. */
export function getApiErrorDetails(
  body: unknown,
  fallbackMessage: string,
): Pick<ApiError, "code" | "message"> {
  if (!hasApiErrorEnvelope(body)) {
    return { code: "unknown_error", message: fallbackMessage };
  }

  return {
    code: typeof body.error.code === "string" ? body.error.code : "unknown_error",
    message: typeof body.error.message === "string" ? body.error.message : fallbackMessage,
  };
}
