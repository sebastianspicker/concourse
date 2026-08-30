/** Maps transport and API failures into stable UI-facing error categories. */
import { ApiErrorException } from "./errors";
import { HttpError, RequestTimeoutError } from "./fetchHelpers";

export type UiErrorKind =
  | "offline"
  | "unavailableSource"
  | "notFound"
  | "rateLimit"
  | "timeout"
  | "invalidResponse"
  | "institutionMismatch"
  | "server"
  | "unknown";

export type UiError = {
  kind: UiErrorKind;
  retryAfterInSeconds?: number;
};

type ErrorFactory = (retryAfterInSeconds?: number) => UiError;

const CODE_ERROR_FACTORIES: Readonly<Record<string, ErrorFactory>> = {
  institution_mismatch: () => ({ kind: "institutionMismatch" }),
  validation_error: () => ({ kind: "invalidResponse" }),
  timeout: () => ({ kind: "timeout" }),
  rate_limited: (retryAfterInSeconds) => ({ kind: "rateLimit", retryAfterInSeconds }),
  not_found: () => ({ kind: "unavailableSource" }),
  institution_not_found: () => ({ kind: "notFound" }),
};

const STATUS_ERROR_FACTORIES: Readonly<Record<number, ErrorFactory>> = {
  404: () => ({ kind: "notFound" }),
  429: (retryAfterInSeconds) => ({ kind: "rateLimit", retryAfterInSeconds }),
};

/** Suppresses caller-requested cancellation rather than presenting it as a user-visible failure. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** Recognizes legacy transport timeout wording that is not represented by RequestTimeoutError. */
function isTimeoutMessage(error: unknown): boolean {
  return error instanceof Error && /timeout|aborted/i.test(error.message);
}

/** Maps stable BFF error codes to semantic, user-facing error categories. */
function fromCode(code: string, status: number, retryAfterInSeconds?: number): UiError {
  const factory = CODE_ERROR_FACTORIES[code] ?? STATUS_ERROR_FACTORIES[status];
  if (factory) return factory(retryAfterInSeconds);
  if (status >= 500) return { kind: "server" };
  return { kind: "unknown" };
}

/** Converts transport failures into stable presentation categories without leaking internals. */
export function toUiError(error: unknown): UiError | null {
  if (error instanceof RequestTimeoutError) return { kind: "timeout" };
  if (isAbortError(error)) return null;
  if (error instanceof HttpError) {
    return fromCode(error.code, error.status, error.retryAfterInSeconds);
  }
  if (error instanceof ApiErrorException) return fromCode(error.code, error.status, error.retryAfterInSeconds);
  if (error instanceof TypeError) return { kind: "offline" };
  if (isTimeoutMessage(error)) {
    return { kind: "timeout" };
  }
  return { kind: "unknown" };
}
