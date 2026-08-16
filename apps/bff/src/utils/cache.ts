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

function sweepExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      evictions += 1;
    }
  }
  if (inFlight.size > 200) log("warn", "cache_inflight_potentially_leaked", { count: inFlight.size });
}

let sweepInterval: ReturnType<typeof setInterval> | null = setInterval(sweepExpiredEntries, CLEANUP_INTERVAL_MS);
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

/** Returns a fresh entry, or removes an expired or force-invalidated one. */
function getCachedEntry<T>(key: string, force: boolean | undefined): CacheEntry<T> | undefined {
  if (force) {
    cache.delete(key);
    return undefined;
  }

  const entry = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (entry?.expiresAt && entry.expiresAt > now) {
    hits += 1;
    cache.set(key, { ...entry, lastAccessedAt: now });
    return entry;
  }
  if (entry) cache.delete(key);
  return undefined;
}

/** Reuses matching work first, then rejects new work once the hard cap is reached. */
function getAdmittedInFlight<T>(key: string): Promise<T> | undefined {
  const existing = inFlight.get(key);
  if (existing) return existing.promise as Promise<T>;
  if (inFlight.size >= MAX_IN_FLIGHT) {
    log("error", "cache_inflight_limit_reached", { count: inFlight.size, key });
    throw new Error("Server busy: too many concurrent data requests");
  }
  return undefined;
}

/** Executes a loader and stores only successful, non-aborted cacheable results. */
async function loadAndStore<T>(key: string, loader: CacheLoader<T>, ttlMs: number, controller: AbortController, shouldCache: (value: T) => boolean): Promise<T> {
  const value = await loader(controller.signal);
  if (!controller.signal.aborted && shouldCache(value)) {
    const storedAt = Date.now();
    cache.set(key, { value, expiresAt: storedAt + ttlMs, lastAccessedAt: storedAt });
    evictIfOverCap();
  }
  return value;
}

/** Aborts and rejects an in-flight loader once its deadline passes. */
function withInFlightTimeout<T>(work: Promise<T>, controller: AbortController, timeoutMs: number): Promise<T> {
  let timeoutReject: (reason: Error) => void = () => undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutReject = reject;
  });
  const timer = setTimeout(() => {
    controller.abort();
    timeoutReject(new Error("Cache loader timeout"));
  }, timeoutMs);
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** Keeps timed-out loaders admitted until the underlying operation settles. */
function releaseInFlightWhenSettled(key: string, entry: InFlightEntry, work: Promise<unknown>): void {
  void work.then(
    () => {
      if (inFlight.get(key) === entry) inFlight.delete(key);
    },
    () => {
      if (inFlight.get(key) === entry) inFlight.delete(key);
    }
  );
}

/**
 * Returns a cached value or shares one in-flight load; callers may reject
 * successful values from caching without changing the returned result.
 */
export async function getCached<T>(key: string, loader: CacheLoader<T>, ttlMs: number, options?: { inFlightTimeoutMs?: number; force?: boolean; shouldCache?: (value: T) => boolean }): Promise<T> {
  const cached = getCachedEntry<T>(key, options?.force);
  if (cached) return cached.value;

  misses += 1;
  const existing = getAdmittedInFlight<T>(key);
  if (existing) return existing;

  const controller = new AbortController();
  const timeoutMs = options?.inFlightTimeoutMs ?? DEFAULT_IN_FLIGHT_TIMEOUT_MS;
  const shouldCache = options?.shouldCache ?? (() => true);
  const entry: InFlightEntry = { controller, promise: Promise.resolve() };
  const work = loadAndStore(key, loader, ttlMs, controller, shouldCache);
  entry.promise = withInFlightTimeout(work, controller, timeoutMs);
  inFlight.set(key, entry);
  releaseInFlightWhenSettled(key, entry, work);

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
