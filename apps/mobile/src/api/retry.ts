import { createAbortError, getRetryDelayMs, shouldRetry, sleep } from "./retryHelpers";

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

      const delay = getRetryDelayMs(err, baseDelayMs, attempt, multiplier, maxDelayMs);
      await sleep(delay, signal);
    }
  }
}
