import { z } from "zod";

export const ErrorKind = {
  NOT_FOUND: "not_found",
  VALIDATION: "validation",
  UPSTREAM: "upstream",
  RATE_LIMITED: "rate_limited",
  INTERNAL: "internal",
  TIMEOUT: "timeout",
} as const;

export type ErrorKindValue = (typeof ErrorKind)[keyof typeof ErrorKind];

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

const STATUS_BY_KIND: Record<ErrorKindValue, number> = {
  [ErrorKind.NOT_FOUND]: 404,
  [ErrorKind.VALIDATION]: 400,
  [ErrorKind.UPSTREAM]: 502,
  [ErrorKind.RATE_LIMITED]: 429,
  [ErrorKind.INTERNAL]: 500,
  [ErrorKind.TIMEOUT]: 504,
};

export function httpStatusForKind(kind: ErrorKindValue): number {
  return STATUS_BY_KIND[kind];
}

export function createAppError(
  kind: ErrorKindValue,
  code: string,
  message: string
): AppError {
  return { kind, message, code };
}
