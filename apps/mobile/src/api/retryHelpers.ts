export function createAbortError(): Error {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

function isHttpLikeError(err: unknown): err is { status: number; retryAfterInSeconds?: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as Record<string, unknown>).status === "number"
  );
}

export function shouldRetry(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return false;

  if (isHttpLikeError(err)) {
    if (err.status === 429) return true;
    return err.status >= 500;
  }

  // Network errors often surface as TypeError in fetch.
  return err instanceof TypeError;
}

function randomUnitInterval(): number {
  const bytes = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] / 0x100000000;
  }
  return 0.5;
}

function backoffWithJitter(
  baseDelayMs: number,
  attempt: number,
  multiplier: number,
  maxDelayMs: number
): number {
  const exp = Math.min(6, attempt);
  const calculated = baseDelayMs * Math.pow(multiplier, exp);
  // +-25% jitter: random in [-0.25, +0.25]
  const jitterFactor = (randomUnitInterval() - 0.5) * 0.5;
  const withJitter = calculated + jitterFactor * calculated;
  return Math.min(Math.floor(withJitter), maxDelayMs);
}

export function getRetryDelayMs(
  err: unknown,
  baseDelayMs: number,
  attempt: number,
  multiplier: number,
  maxDelayMs: number
): number {
  const retryAfterSeconds = isHttpLikeError(err) ? err.retryAfterInSeconds : undefined;
  return typeof retryAfterSeconds === "number"
    ? retryAfterSeconds * 1000
    : backoffWithJitter(baseDelayMs, attempt, multiplier, maxDelayMs);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(createAbortError());
    };

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
