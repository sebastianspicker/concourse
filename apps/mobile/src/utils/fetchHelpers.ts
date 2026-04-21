export type BffError = {
  code: string;
  message: string;
};

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterInSeconds: number | undefined;

  constructor(opts: { message: string; status: number; code: string; retryAfterInSeconds?: number }) {
    super(opts.message);
    this.name = "HttpError";
    this.status = opts.status;
    this.code = opts.code;
    this.retryAfterInSeconds = opts.retryAfterInSeconds;
  }
}

function parseRetryAfterSeconds(retryAfter: string | null): number | undefined {
  if (!retryAfter) return undefined;
  // #62: Support both seconds and HTTP-date
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) return seconds;
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1000));
  }
  return undefined;
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const cleanup = linkAbortSignals(controller, init?.signal);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      const bffError = await parseBffError(response);
      const message =
        bffError.code === "unknown_error"
          ? `Request failed (${response.status})`
          : bffError.message;
      throw new HttpError({
        message,
        status: response.status,
        code: bffError.code,
        retryAfterInSeconds: parseRetryAfterSeconds(response.headers.get("retry-after"))
      });
    }

    // #61: Handle 204 No Content or empty bodies
    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  } finally {
    cleanup();
    clearTimeout(timeoutId);
  }
}

function isErrorBody(body: unknown): body is { error: Record<string, unknown> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as Record<string, unknown>).error === "object" &&
    (body as Record<string, unknown>).error !== null
  );
}

export async function parseBffError(response: Response): Promise<BffError> {
  try {
    const body: unknown = await response.json();
    if (isErrorBody(body)) {
      const code = typeof body.error.code === "string" ? body.error.code : "unknown_error";
      const message =
        typeof body.error.message === "string" ? body.error.message : "Unknown error";
      return { code, message };
    }
  } catch {
    // ignore
  }

  return { code: "unknown_error", message: "Unknown error" };
}

function linkAbortSignals(
  controller: AbortController,
  external?: AbortSignal | null
): () => void {
  if (!external) {
    return () => undefined;
  }

  if (external.aborted) {
    controller.abort();
    return () => undefined;
  }

  const onAbort = () => controller.abort();
  external.addEventListener("abort", onAbort, { once: true });

  return () => external.removeEventListener("abort", onAbort);
}
