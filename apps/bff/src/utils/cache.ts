import { log } from "./logger";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
};

export type CacheStats = {
  readonly size: number;
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const DEFAULT_IN_FLIGHT_TIMEOUT_MS = 25_000;
const MAX_CACHE_ENTRIES = 1000;
const MAX_IN_FLIGHT = 500; // #65: Hard limit for memory safety
const CLEANUP_INTERVAL_MS = 60_000;

let hits = 0;
let misses = 0;
let evictions = 0;

// Periodic sweep via setInterval
let sweepInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      evictions += 1;
    }
  }

  // Safety check for stuck in-flight promises (leaked or hung upstream)
  if (inFlight.size > 200) {
    log("warn", "cache_inflight_potentially_leaked", { count: inFlight.size });
  }
}, CLEANUP_INTERVAL_MS);

// Allow the Node.js process to exit naturally even if the sweep interval is still active
if (sweepInterval && typeof sweepInterval.unref === "function") {
  sweepInterval.unref();
}

function evictLru(): void {
  // Find the entry with the oldest lastAccessedAt
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of cache.entries()) {
    // Evict expired entries first
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      evictions += 1;
      return;
    }
    if (entry.lastAccessedAt < oldestAccess) {
      oldestAccess = entry.lastAccessedAt;
      oldestKey = key;
    }
  }

  if (oldestKey !== null) {
    cache.delete(oldestKey);
    evictions += 1;
  }
}

function evictIfOverCap(): void {
  while (cache.size > MAX_CACHE_ENTRIES) {
    evictLru();
  }
}

function timeoutPromise(ms: number): { promise: Promise<never>; timer: ReturnType<typeof setTimeout> } {
  let timer: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Cache loader timeout")), ms);
  });
  return { promise, timer: timer! };
}

export async function getCached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number,
  options?: { inFlightTimeoutMs?: number; force?: boolean }
): Promise<T> {
  const now = Date.now();

  if (!options?.force) {
    const entry = cache.get(key) as CacheEntry<T> | undefined;

    if (entry) {
      if (entry.expiresAt > now) {
        hits += 1;
        // Update lastAccessedAt for LRU (new entry object for immutability)
        cache.set(key, { ...entry, lastAccessedAt: now });
        return entry.value;
      }
      cache.delete(key);
    }
  } else {
    cache.delete(key);
  }

  misses += 1;

  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // #65: Enforce hard limit on concurrent loaders
  if (inFlight.size >= MAX_IN_FLIGHT) {
    log("error", "cache_inflight_limit_reached", { count: inFlight.size, key });
    throw new Error("Server busy: too many concurrent data requests");
  }

  const inFlightTimeoutMs = options?.inFlightTimeoutMs ?? DEFAULT_IN_FLIGHT_TIMEOUT_MS;
  const promiseRef: { current: Promise<unknown> | null } = { current: null };
  const { promise: timeout, timer } = timeoutPromise(inFlightTimeoutMs);
  const promise = (async (): Promise<T> => {
    try {
      const value = await Promise.race([
        loader(),
        timeout
      ]).finally(() => clearTimeout(timer));
      cache.set(key, { value, expiresAt: Date.now() + ttlMs, lastAccessedAt: Date.now() });
      evictIfOverCap();
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
  hits = 0;
  misses = 0;
  evictions = 0;
}

export function cacheStats(): CacheStats {
  return {
    size: cache.size,
    hits,
    misses,
    evictions,
  };
}

export function destroyCache(): void {
  if (sweepInterval !== null) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
  clearCache();
}
