import { createAbortError, getRetryDelayMs, shouldRetry, sleep } from "./retryHelpers";

type AttemptResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

function canRetry(error: unknown, attempt: number, retries: number): boolean {
  return attempt <= retries && shouldRetry(error);
}

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

    let result: AttemptResult<T>;
    try {
      result = { ok: true, value: await fn() };
    } catch (error: unknown) {
      result = { ok: false, error };
    }
    if (result.ok) {
      return result.value;
    }

    attempt += 1;
    if (!canRetry(result.error, attempt, retries)) {
      throw result.error;
    }

    const delay = getRetryDelayMs(result.error, baseDelayMs, attempt, multiplier, maxDelayMs);
    await sleep(delay, signal);
  }
}
