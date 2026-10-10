/** Tracks fixed-window request quotas by derived client key. */

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = { allowed: boolean; retryAfter: number };
export type RateLimiter = {
  check(key: string, options?: { limit?: number; windowMs?: number }): RateLimitResult;
};

const cleanupIntervalMs = 60_000;
const maxBuckets = 20_000;

/** Evicts retained state before the configured memory cap can be exceeded. */
function evictIfOverCap(buckets: Map<string, Bucket>): void {
  if (buckets.size < maxBuckets) return;

  // Maps in JS/TS preserve insertion order. Removing from the beginning
  // of the iterator removes the oldest entries.
  const toEvict = buckets.size - Math.floor(maxBuckets * 0.8);
  const keys = buckets.keys();

  for (let i = 0; i < toEvict; i++) {
    const key = keys.next().value;
    if (key === undefined) break;
    buckets.delete(key);
  }
}

/** Removes expired buckets from the retained state. */
function removeExpired(buckets: Map<string, Bucket>, now: number): void {
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/** Creates an isolated limiter so each listener owns its quota state. */
export function createRateLimiter(): RateLimiter {
  const buckets = new Map<string, Bucket>();
  let lastCleanup = 0;

  /** Periodically removes expired buckets without adding cleanup work to every request. */
  function maybeCleanup(now: number): void {
    if (now - lastCleanup < cleanupIntervalMs) return;
    lastCleanup = now;
    removeExpired(buckets, now);
  }

  /** Consumes a fixed-window quota and returns the retry delay when it is exhausted. */
  function check(key: string, options?: { limit?: number; windowMs?: number }): RateLimitResult {
    const limit = options?.limit ?? 60;
    const windowMs = options?.windowMs ?? 60_000;
    const now = Date.now();
    maybeCleanup(now);
    evictIfOverCap(buckets);

    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    const currentCount = existing.count;
    if (currentCount >= limit) {
      const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return { allowed: false, retryAfter };
    }

    // Mutate in-place for atomic increment within the Node.js event loop tick.
    // Creating a new object via buckets.set() would not be atomic if an async
    // yield occurred between the read and the write.
    existing.count = currentCount + 1;
    return { allowed: true, retryAfter: 0 };
  }

  return { check };
}
