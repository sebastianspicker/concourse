/** Provides a bounded TTL cache with deduplicated in-flight loads. */

import { log } from "./logger";

type CacheEntry<T> = { value: T; expiresAt: number; lastAccessedAt: number };
type InFlightEntry = { promise: Promise<unknown>; controller: AbortController };
export type CacheLoader<T> = (signal: AbortSignal) => Promise<T>;
export type CacheStats = { readonly size: number; readonly hits: number; readonly misses: number; readonly evictions: number };

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, InFlightEntry>();
const DEFAULT_IN_FLIGHT_TIMEOUT_MS = 25_000;
const MAX_CACHE_ENTRIES = 1000;
const MAX_IN_FLIGHT = 500;
const CLEANUP_INTERVAL_MS = 60_000;
let hits = 0;
let misses = 0;
let evictions = 0;

let sweepInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      evictions += 1;
    }
  }
  if (inFlight.size > 200) log("warn", "cache_inflight_potentially_leaked", { count: inFlight.size });
}, CLEANUP_INTERVAL_MS);
if (sweepInterval && typeof sweepInterval.unref === "function") sweepInterval.unref();

/** Evicts retained state before the configured memory cap can be exceeded. */
function evictIfOverCap(): void {
  while (cache.size > MAX_CACHE_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt <= Date.now()) {
        oldestKey = key;
        break;
      }
      if (entry.lastAccessedAt < oldestAccess) {
        oldestAccess = entry.lastAccessedAt;
        oldestKey = key;
      }
    }
    if (!oldestKey) return;
    cache.delete(oldestKey);
    evictions += 1;
  }
}

/**
 * Returns a cached value or shares one in-flight load; callers may reject
 * successful values from caching without changing the returned result.
 */
export async function getCached<T>(key: string, loader: CacheLoader<T>, ttlMs: number, options?: { inFlightTimeoutMs?: number; force?: boolean; shouldCache?: (value: T) => boolean }): Promise<T> {
  const now = Date.now();
  if (!options?.force) {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (entry?.expiresAt && entry.expiresAt > now) {
      hits += 1;
      cache.set(key, { ...entry, lastAccessedAt: now });
      return entry.value;
    }
    if (entry) cache.delete(key);
  } else {
    cache.delete(key);
  }
  misses += 1;
  const existing = inFlight.get(key);
  if (existing) return existing.promise as Promise<T>;
  if (inFlight.size >= MAX_IN_FLIGHT) {
    log("error", "cache_inflight_limit_reached", { count: inFlight.size, key });
    throw new Error("Server busy: too many concurrent data requests");
  }

  const controller = new AbortController();
  const timeoutMs = options?.inFlightTimeoutMs ?? DEFAULT_IN_FLIGHT_TIMEOUT_MS;
  const shouldCache = options?.shouldCache ?? (() => true);
  const entry: InFlightEntry = { controller, promise: Promise.resolve() };
  const work = (async () => {
    const value = await loader(controller.signal);
    if (!controller.signal.aborted && shouldCache(value)) {
      const storedAt = Date.now();
      cache.set(key, { value, expiresAt: storedAt + ttlMs, lastAccessedAt: storedAt });
      evictIfOverCap();
    }
    return value;
  })();

  /** Rejects the timeout race when the in-flight loader exceeds its deadline. */
  let timeoutReject: (reason: Error) => void = () => undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutReject = reject;
  });
  const timer = setTimeout(() => {
    controller.abort();
    timeoutReject(new Error("Cache loader timeout"));
  }, timeoutMs);

  entry.promise = Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  inFlight.set(key, entry);

  // Keep timed-out loaders accounted for until their underlying work actually
  // settles. This prevents a loader that ignores AbortSignal from spawning an
  // unbounded series of orphan retries.
  void work.then(
    () => {
      if (inFlight.get(key) === entry) inFlight.delete(key);
    },
    () => {
      if (inFlight.get(key) === entry) inFlight.delete(key);
    }
  );

  return entry.promise as Promise<T>;
}

/** Clears one cached key or all values and in-flight loads when no key is supplied. */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
    inFlight.get(key)?.controller.abort();
    inFlight.delete(key);
    return;
  }
  cache.clear();
  for (const entry of inFlight.values()) entry.controller.abort();
  inFlight.clear();
  hits = 0;
  misses = 0;
  evictions = 0;
}

/** Returns cache counters for diagnostics without exposing cached values. */
export function cacheStats(): CacheStats {
  return { size: cache.size, hits, misses, evictions };
}

/** Stops cache maintenance and releases all retained values during shutdown. */
export function destroyCache(): void {
  if (sweepInterval !== null) {
    clearInterval(sweepInterval);
    sweepInterval = null;
  }
  clearCache();
}
