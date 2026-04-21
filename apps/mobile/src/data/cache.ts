type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const MAX_CACHE_ENTRIES = 50;
const DEFAULT_LOADER_TIMEOUT_MS = 15_000;

function timeoutPromise(ms: number): { promise: Promise<never>; timer: ReturnType<typeof setTimeout> } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Cache loader timeout")), ms);
  });
  return { promise, timer: timer! };
}

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

  // #72: Reuse in-flight promise even if forcing (to avoid parallel redundant net calls)
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promiseRef: { current: Promise<unknown> | null } = { current: null };
  const { promise: timeout, timer } = timeoutPromise(DEFAULT_LOADER_TIMEOUT_MS);
  const promise = (async () => {
    try {
      // #73: Add timeout to prevent infinite loading state
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

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
    inFlight.delete(key);
    return;
  }

  cache.clear();
  inFlight.clear();
}
