/** Chooses localized error copy and presentation type from normalized UI failures. */
import type { UiError, UiErrorKind } from "../api/uiError";
import type { TranslationKey } from "../i18n/dictionaries";

export type ErrorType = "network" | "notFound" | "generic";

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

/** Converts transport and HTTP errors into the UI’s three presentation categories. */
export function getErrorType(error?: UiError, fallback: ErrorType = "generic"): ErrorType {
  return error ? (ERROR_TYPE_BY_KIND[error.kind] ?? "generic") : fallback;
}

/** Maps a presentation category to its localized title key. */
export function getErrorTitleKey(errorType: ErrorType): TranslationKey {
  return TITLE_KEY_BY_ERROR_TYPE[errorType];
}

/** Prefers server-safe error text and otherwise selects localized fallback copy. */
export function getErrorMessage(
  error: UiError | undefined,
  message: string | undefined,
  translate: (key: TranslationKey) => string
): string {
  return error ? translate(error.messageKey) : (message ?? translate("errorUnknown"));
}
