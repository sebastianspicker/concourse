import type { ErrorType } from "./ErrorState";
import type { UiError } from "../api/uiError";

export function detectResourceErrorType(error: string | UiError): ErrorType {
  if (typeof error !== "string") {
    if (error.kind === "offline" || error.kind === "timeout") return "network";
    if (error.kind === "notFound" || error.kind === "unavailableSource") return "notFound";
    return "generic";
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
