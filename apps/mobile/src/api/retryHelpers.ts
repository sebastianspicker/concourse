/** Classifies retryable failures and implements cancellable retry timing. */
export function createAbortError(): Error {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

/** Narrows transport failures that expose status and optional server retry guidance. */
function isHttpLikeError(err: unknown): err is { status: number; retryAfterInSeconds?: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as Record<string, unknown>).status === "number"
  );
}

/** Allows retries only for retryable HTTP failures within the configured attempt budget. */
export function shouldRetry(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return false;

  if (isHttpLikeError(err)) {
    if (err.status === 429) return true;
    return err.status >= 500;
  }

  // Network errors often surface as TypeError in fetch.
  return err instanceof TypeError;
}

/** Normalizes the injected random source to a bounded jitter fraction. */
function randomUnitInterval(): number {
  const bytes = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] / 0x100000000;
  }
  return 0.5;
}

/** Applies symmetric jitter to an exponential delay without producing negative waits. */
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

/** Prefers server Retry-After guidance, otherwise computes capped exponential backoff. */
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

/** Waits for the requested delay unless cancellation aborts the retry loop first. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

/** Removes the abort listener and timer after the retry wait settles. */
    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };

/** Rejects the pending retry delay with the standard abort error. */
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
