/** Chooses localized error copy and presentation type from normalized UI failures. */
import type { UiError, UiErrorKind } from "@/platform/http/uiError";
import type { TranslationKey } from "@/localization/dictionaries";
import type { ErrorType } from "./errorStateTypes";

export type { ErrorType } from "./errorStateTypes";

const ERROR_TYPE_BY_KIND: Partial<Record<UiErrorKind, ErrorType>> = {
  unavailableSource: "notFound",
  notFound: "notFound",
  offline: "network",
  timeout: "network",
};

const TITLE_KEY_BY_ERROR_TYPE: Record<ErrorType, TranslationKey> = {
  network: "errorTitleNetwork",
  notFound: "errorTitleNotFound",
  generic: "errorTitleGeneric",
};

const MESSAGE_KEY_BY_KIND: Record<UiErrorKind, TranslationKey> = {
  offline: "errorOffline",
  unavailableSource: "errorUnavailable",
  notFound: "errorNotFound",
  rateLimit: "errorRateLimit",
  timeout: "errorTimeout",
  invalidResponse: "errorInvalidResponse",
  institutionMismatch: "errorInstitutionMismatch",
  server: "errorServer",
  unknown: "errorUnknown",
};

/** Converts transport and HTTP errors into the UI’s three presentation categories. */
export function getErrorType(error?: UiError, fallback: ErrorType = "generic"): ErrorType {
  return error ? (ERROR_TYPE_BY_KIND[error.kind] ?? "generic") : fallback;
}

/** Maps a presentation category to its localized title key. */
export function getErrorTitleKey(errorType: ErrorType): TranslationKey {
  return TITLE_KEY_BY_ERROR_TYPE[errorType];
}

/** Maps a normalized semantic failure to the localized copy owned by the design system. */
export function getErrorMessageKey(error: UiError): TranslationKey {
  return MESSAGE_KEY_BY_KIND[error.kind];
}

/** Prefers server-safe error text and otherwise selects localized fallback copy. */
export function getErrorMessage(
  error: UiError | undefined,
  message: string | undefined,
  translate: (key: TranslationKey) => string
): string {
  return error ? translate(getErrorMessageKey(error)) : (message ?? translate("errorUnknown"));
}
