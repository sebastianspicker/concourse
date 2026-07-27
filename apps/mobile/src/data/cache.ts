/** Deduplicates bounded in-memory resource requests and expires stale values. */
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const MAX_CACHE_ENTRIES = 50;
const DEFAULT_LOADER_TIMEOUT_MS = 15_000;

/** Races an operation against a timeout that is cleared once either outcome settles. */
function timeoutPromise(ms: number): { promise: Promise<never>; timer: ReturnType<typeof setTimeout> } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Cache loader timeout")), ms);
  });
  return { promise, timer: timer! };
}

/** Removes oldest memory entries until the cache is within its configured capacity. */
function evictIfNeeded(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  // Map preserves insertion order. Remove oldest-inserted (FIFO) entries.
  const it = cache.keys();
  while (cache.size > MAX_CACHE_ENTRIES) {
    const key = it.next().value;
    if (key === undefined) break;
    cache.delete(key);
  }
}

/**
 * Shares one bounded network load per key and serves only unexpired in-memory values.
 * A loader timeout prevents a stalled transport from pinning callers indefinitely.
 */
export async function getCached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number,
  force = false
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!force && entry && entry.expiresAt > now) {
    return entry.value;
  }

  // Keep one loader per key in flight, including forced refreshes, so pull-to-
  // refresh and initial render cannot stampede the BFF with duplicate requests.
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promiseRef: { current: Promise<unknown> | null } = { current: null };
  const { promise: timeout, timer } = timeoutPromise(DEFAULT_LOADER_TIMEOUT_MS);
/** Records the in-flight loader immediately so concurrent callers share the same request. */
  const promise = (async () => {
    try {
      // A hung loader would otherwise leave the screen in loading state forever.
      const value = await Promise.race([
        loader(),
        timeout
      ]).finally(() => clearTimeout(timer));
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      evictIfNeeded();
      return value;
    } finally {
      if (inFlight.get(key) === promiseRef.current) inFlight.delete(key);
    }
  })();
  promiseRef.current = promise;
  inFlight.set(key, promise);
  return promise as Promise<T>;
}

/** Clears cache without disturbing unrelated stored state. */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
    inFlight.delete(key);
    return;
  }

  cache.clear();
  inFlight.clear();
}
