export class TimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = 10_000
): Promise<Response> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = options?.signal
    ? AbortSignal.any([timeoutController.signal, options.signal])
    : timeoutController.signal;

  try {
    return await fetch(url, { ...options, signal });
  } catch (err: unknown) {
    if (
      err instanceof DOMException &&
      err.name === "AbortError" &&
      timeoutController.signal.aborted
    ) {
      throw new TimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Fetch a URL and return the response body as text, enforcing a 10 MB size limit.
 * Throws if the response status is not ok, if Content-Length exceeds the limit,
 * or if the streamed body exceeds the limit.
 */
export async function fetchTextWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = 10_000
): Promise<string> {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new Error(`Response too large: ${contentLength} bytes`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        void reader.cancel();
        throw new Error(`Response body exceeds ${MAX_RESPONSE_BYTES} bytes`);
      }
      chunks.push(value);
    }
  } catch (err: unknown) {
    void reader.cancel();
    throw err;
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}
