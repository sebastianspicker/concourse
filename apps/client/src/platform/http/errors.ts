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

/** Narrows unknown API payloads to objects carrying the expected error member. */
export function hasApiErrorEnvelope(body: unknown): body is { error: Record<string, unknown> } {
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

/** Normalizes arbitrary error payloads to a stable code, message, and HTTP status. */
export function parseApiError(response: Response, body?: unknown): ApiError {
  const status = response.status;
  return { ...getApiErrorDetails(body, `Request failed (${status})`), status };
}
