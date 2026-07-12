import { parseRetryAfterSeconds } from "./retryAfter";

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

export type JsonResponse<T> = {
  data: T;
  headers: Headers;
};

function assertClientHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid BFF URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("BFF URL must use http or https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("BFF URL must not include credentials");
  }
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<T> {
  const response = await fetchJsonResponseWithTimeout<T>(url, init, timeoutMs);
  return response.data;
}

export async function fetchJsonResponseWithTimeout<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 10_000
): Promise<JsonResponse<T>> {
  assertClientHttpUrl(url);

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

    // Some BFF responses intentionally have no body; callers still expect an
    // object-shaped value so schema parsing can decide what to do next.
    if (response.status === 204) {
      return { data: {} as T, headers: response.headers };
    }

    const text = await response.text();
    if (!text) {
      return { data: {} as T, headers: response.headers };
    }

    return { data: JSON.parse(text) as T, headers: response.headers };
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
    // Non-JSON error pages still map to the generic client error below.
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
