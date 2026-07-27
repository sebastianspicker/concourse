/** Classifies legacy string and normalized errors into shared resource-error presentation types. */
import { getErrorType, type ErrorType } from "./ErrorState";
import type { UiError } from "../api/uiError";

/** Detects a 404 separately so resource screens can offer accurate recovery copy. */
export function detectResourceErrorType(error: string | UiError): ErrorType {
  if (typeof error !== "string") {
    return getErrorType(error);
  }
  const lower = error.toLowerCase();
  if (isNetworkErrorText(lower)) {
    return "network";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "notFound";
  }
  return "generic";
}

function isNetworkErrorText(lower: string): boolean {
  return [
    "network",
    "connection",
    "offline",
    "timeout",
    "fetch",
    "request failed"
  ].some((needle) => lower.includes(needle));
}
