import { ApiErrorException } from "./errors";
import { HttpError } from "../utils/fetchHelpers";
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

function fromCode(code: string, status: number, retryAfterInSeconds?: number): UiError {
  if (code === "institution_mismatch") return { kind: "institutionMismatch", messageKey: "errorInstitutionMismatch" };
  if (code === "validation_error") return { kind: "invalidResponse", messageKey: "errorInvalidResponse" };
  if (code === "timeout") return { kind: "timeout", messageKey: "errorTimeout" };
  if (code === "rate_limited" || status === 429) {
    return { kind: "rateLimit", messageKey: "errorRateLimit", retryAfterInSeconds };
  }
  if (code === "not_found" || code === "institution_not_found" || status === 404) {
    return code === "not_found"
      ? { kind: "unavailableSource", messageKey: "errorUnavailable" }
      : { kind: "notFound", messageKey: "errorNotFound" };
  }
  if (status >= 500) return { kind: "server", messageKey: "errorServer" };
  return { kind: "unknown", messageKey: "errorUnknown" };
}

export function toUiError(error: unknown): UiError | null {
  if (error instanceof Error && error.name === "AbortError") return null;
  if (error instanceof HttpError) {
    return fromCode(error.code, error.status, error.retryAfterInSeconds);
  }
  if (error instanceof ApiErrorException) return fromCode(error.code, error.status);
  if (error instanceof TypeError) return { kind: "offline", messageKey: "errorOffline" };
  if (error instanceof Error && /timeout|aborted/i.test(error.message)) {
    return { kind: "timeout", messageKey: "errorTimeout" };
  }
  return { kind: "unknown", messageKey: "errorUnknown" };
}
