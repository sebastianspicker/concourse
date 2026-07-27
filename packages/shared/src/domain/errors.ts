/** Defines the cross-layer error vocabulary shared by the BFF and mobile client. */
import { z } from "zod";

/** Stable semantic categories used to map internal failures onto public HTTP responses. */
export const ErrorKind = {
  NOT_FOUND: "not_found",
  VALIDATION: "validation",
  UPSTREAM: "upstream",
  RATE_LIMITED: "rate_limited",
  INTERNAL: "internal",
  TIMEOUT: "timeout",
} as const;

export type ErrorKindValue = (typeof ErrorKind)[keyof typeof ErrorKind];

/** Runtime schema for validating errors that cross a package or network boundary. */
const ErrorKindEnum = z.enum([
  ErrorKind.NOT_FOUND,
  ErrorKind.VALIDATION,
  ErrorKind.UPSTREAM,
  ErrorKind.RATE_LIMITED,
  ErrorKind.INTERNAL,
  ErrorKind.TIMEOUT,
]);

export const AppErrorSchema = z.object({
  kind: ErrorKindEnum,
  message: z.string(),
  code: z.string(),
});

export type AppError = z.infer<typeof AppErrorSchema>;

export const ErrorResponseSchema = z.object({
  error: AppErrorSchema,
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// Keeping the mapping beside the shared error kinds prevents route-specific
// status choices from drifting between otherwise equivalent failures.
const STATUS_BY_KIND: Record<ErrorKindValue, number> = {
  [ErrorKind.NOT_FOUND]: 404,
  [ErrorKind.VALIDATION]: 400,
  [ErrorKind.UPSTREAM]: 502,
  [ErrorKind.RATE_LIMITED]: 429,
  [ErrorKind.INTERNAL]: 500,
  [ErrorKind.TIMEOUT]: 504,
};

/** Returns the canonical HTTP status for a shared semantic error kind. */
export function httpStatusForKind(kind: ErrorKindValue): number {
  return STATUS_BY_KIND[kind];
}

/** Builds a schema-compatible public error without coupling callers to object layout. */
export function createAppError(
  kind: ErrorKindValue,
  code: string,
  message: string
): AppError {
  return { kind, message, code };
}
