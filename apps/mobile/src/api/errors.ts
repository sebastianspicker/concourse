export type ApiError = {
  code: string;
  message: string;
  status: number;
};

export class ApiErrorException extends Error {
  readonly code: string;
  readonly status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.status = error.status;
  }
}

function hasErrorField(body: unknown): body is { error: Record<string, unknown> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as Record<string, unknown>).error === "object" &&
    (body as Record<string, unknown>).error !== null
  );
}

export function parseApiError(response: Response, body?: unknown): ApiError {
  const status = response.status;

  if (hasErrorField(body)) {
    const code =
      typeof body.error.code === "string"
        ? body.error.code
        : "unknown_error";
    const message =
      typeof body.error.message === "string"
        ? body.error.message
        : `Request failed (${status})`;
    return { code, message, status };
  }

  return { code: "unknown_error", message: `Request failed (${status})`, status };
}
