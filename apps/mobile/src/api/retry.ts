export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; baseDelayMs?: number; multiplier?: number; maxDelayMs?: number; signal?: AbortSignal }
): Promise<T> {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 250;
  const multiplier = options?.multiplier ?? 2;
  const maxDelayMs = options?.maxDelayMs ?? 30_000;
  const signal = options?.signal;

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    try {
      return await fn();
    } catch (err: unknown) {
      attempt += 1;
      if (attempt > retries || !shouldRetry(err)) {
        throw err;
      }

      const retryAfterSeconds = isHttpLikeError(err) ? err.retryAfterInSeconds : undefined;
      const delay = typeof retryAfterSeconds === "number"
        ? retryAfterSeconds * 1000
        : backoffWithJitter(baseDelayMs, attempt, multiplier, maxDelayMs);
      await sleep(delay, signal);
    }
  }
}

function createAbortError(): Error {
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

function shouldRetry(err: unknown): boolean {
  if (err instanceof Error && err.name === "AbortError") return false;

  if (isHttpLikeError(err)) {
    if (err.status === 429) return true;
    return err.status >= 500;
  }

  // Network errors often surface as TypeError in fetch.
  return err instanceof TypeError;
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
  const jitterFactor = (Math.random() - 0.5) * 0.5;
  const withJitter = calculated + jitterFactor * calculated;
  return Math.min(Math.floor(withJitter), maxDelayMs);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
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
