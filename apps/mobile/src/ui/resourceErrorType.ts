import type { ErrorType } from "./ErrorState";

export function detectResourceErrorType(error: string): ErrorType {
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
