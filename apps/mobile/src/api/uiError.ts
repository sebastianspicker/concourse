/** Maps transport and API failures into stable UI-facing error categories. */
import { ApiErrorException } from "./errors";
import { HttpError, RequestTimeoutError } from "../utils/fetchHelpers";
import type { TranslationKey } from "../i18n/dictionaries";

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
  messageKey: TranslationKey;
  retryAfterInSeconds?: number;
};

type ErrorFactory = (retryAfterInSeconds?: number) => UiError;

const CODE_ERROR_FACTORIES: Readonly<Record<string, ErrorFactory>> = {
  institution_mismatch: () => ({ kind: "institutionMismatch", messageKey: "errorInstitutionMismatch" }),
  validation_error: () => ({ kind: "invalidResponse", messageKey: "errorInvalidResponse" }),
  timeout: () => ({ kind: "timeout", messageKey: "errorTimeout" }),
  rate_limited: (retryAfterInSeconds) => ({ kind: "rateLimit", messageKey: "errorRateLimit", retryAfterInSeconds }),
  not_found: () => ({ kind: "unavailableSource", messageKey: "errorUnavailable" }),
  institution_not_found: () => ({ kind: "notFound", messageKey: "errorNotFound" }),
};

const STATUS_ERROR_FACTORIES: Readonly<Record<number, ErrorFactory>> = {
  404: () => ({ kind: "notFound", messageKey: "errorNotFound" }),
  429: (retryAfterInSeconds) => ({ kind: "rateLimit", messageKey: "errorRateLimit", retryAfterInSeconds }),
};

/** Suppresses caller-requested cancellation rather than presenting it as a user-visible failure. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** Recognizes legacy transport timeout wording that is not represented by RequestTimeoutError. */
function isTimeoutMessage(error: unknown): boolean {
  return error instanceof Error && /timeout|aborted/i.test(error.message);
}

/** Maps stable BFF error codes to translated, user-facing error presentation. */
function fromCode(code: string, status: number, retryAfterInSeconds?: number): UiError {
  const factory = CODE_ERROR_FACTORIES[code] ?? STATUS_ERROR_FACTORIES[status];
  if (factory) return factory(retryAfterInSeconds);
  if (status >= 500) return { kind: "server", messageKey: "errorServer" };
  return { kind: "unknown", messageKey: "errorUnknown" };
}

/** Converts transport failures into stable, localized presentation categories without leaking internals. */
export function toUiError(error: unknown): UiError | null {
  if (error instanceof RequestTimeoutError) return { kind: "timeout", messageKey: "errorTimeout" };
  if (isAbortError(error)) return null;
  if (error instanceof HttpError) {
    return fromCode(error.code, error.status, error.retryAfterInSeconds);
  }
  if (error instanceof ApiErrorException) return fromCode(error.code, error.status);
  if (error instanceof TypeError) return { kind: "offline", messageKey: "errorOffline" };
  if (isTimeoutMessage(error)) {
    return { kind: "timeout", messageKey: "errorTimeout" };
  }
  return { kind: "unknown", messageKey: "errorUnknown" };
}
