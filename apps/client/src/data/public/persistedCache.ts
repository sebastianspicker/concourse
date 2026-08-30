/** Persists validated public data and implements network-first offline fallback semantics. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { ApiErrorException } from "@/platform/http/errors";
import type { StorageValueReader } from "@/platform/storage/readAndMigrateLegacyValue";
import { HttpError, RequestTimeoutError } from "@/platform/http/fetchHelpers";

type StorageLike = StorageValueReader & {
  getAllKeys?: () => Promise<readonly string[]>;
  multiRemove?: (keys: readonly string[]) => Promise<void>;
};

export const CACHE_STORAGE_NAMESPACE = "concourse:";
const LEGACY_CACHE_STORAGE_NAMESPACE = "campus-app-kit:";
const memory = new Map<string, string>();

export type CachedEntry<T> = {
  data: T;
  timestamp: number;
  isOffline?: boolean;
};

type CacheValidator<T> = (value: unknown) => value is T;

const NON_RETRYABLE_ERROR_CODES = new Set(["institution_mismatch", "validation_error"]);

// Public campus data is useful offline, but stale schedules/events can mislead
// users. After this window, network errors should be surfaced instead.
export const OFFLINE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Uses AsyncStorage when available and an in-memory adapter for unsupported test or web runtimes. */
async function getStorage(): Promise<StorageLike> {
  return (await getNativeStorage()) ?? createMemoryStorage();
}

/** Creates the unsupported-runtime storage adapter without sharing state with unrelated keys. */
function createMemoryStorage(): StorageLike {
  return {
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => {
      memory.set(key, value);
    },
    removeItem: async (key) => {
      memory.delete(key);
    },
    getAllKeys: async () => [...memory.keys()],
    multiRemove: async (keys) => {
      for (const key of keys) memory.delete(key);
    }
  };
}

/** Uses the native adapter only after confirming its backing implementation responds. */
async function getNativeStorage(): Promise<StorageLike | null> {
  // Try to use AsyncStorage directly (native), but fall back if the JS object
  // exists without a working native backing implementation.
  if (!isStorageAdapter(AsyncStorage)) return null;

  try {
    await AsyncStorage.getItem(`${CACHE_STORAGE_NAMESPACE}__probe__`);
    return AsyncStorage as StorageLike;
  } catch {
    return null;
  }
}

function isStorageAdapter(value: unknown): value is StorageLike {
  return typeof value === "object" && value !== null && "getItem" in value &&
    typeof value.getItem === "function";
}

const CACHE_ENTRY_ENVELOPE_SCHEMA = z.object({
  data: z.unknown(),
  timestamp: z.number().finite().nonnegative(),
  isOffline: z.boolean().optional(),
}).refine((entry) => Object.hasOwn(entry, "data"), { message: "Cache entry data is required" })
  .refine((entry) => entry.timestamp <= Date.now() + 5 * 60 * 1000, { message: "Cache entry timestamp is in the future" });

/** Validates cache envelope shape and optionally narrows its payload before it reaches callers. */
function isCacheEntry<T>(value: unknown, validator?: CacheValidator<T>): value is CachedEntry<T> {
  const envelope = CACHE_ENTRY_ENVELOPE_SCHEMA.safeParse(value);
  if (!envelope.success) return false;
  return validator ? validator(envelope.data.data) : true;
}

/** Parses a cache envelope without mutating either storage namespace. */
function parseCacheEntry<T>(raw: string, validator?: CacheValidator<T>): CachedEntry<T> | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCacheEntry<T>(parsed, validator) ? parsed : null;
  } catch {
    return null;
  }
}

type RawCacheEntry<T> = { raw: string; entry: CachedEntry<T> };

/** Reads a cache envelope and removes it when validation fails. */
async function readCacheEntry<T>(storage: StorageLike, key: string, validator?: CacheValidator<T>): Promise<RawCacheEntry<T> | null> {
  const raw = await storage.getItem(key);
  if (raw === null) return null;

  const entry = parseCacheEntry<T>(raw, validator);
  if (entry) return { raw, entry };
  await storage.removeItem(key).catch(() => undefined);
  return null;
}

/** Parses, schema-validates, and deletes malformed persisted envelopes before returning them. */
async function getPersistedCacheEntry<T>(key: string, validator?: CacheValidator<T>): Promise<CachedEntry<T> | null> {
  const storage = await getStorage();
  const storageKey = CACHE_STORAGE_NAMESPACE + key;
  const currentEntry = await readCacheEntry<T>(storage, storageKey, validator);
  if (currentEntry) return currentEntry.entry;

  const legacyStorageKey = LEGACY_CACHE_STORAGE_NAMESPACE + key;
  const legacyEntry = await readCacheEntry<T>(storage, legacyStorageKey, validator);
  if (!legacyEntry) return null;

  try {
    await storage.setItem(storageKey, legacyEntry.raw);
  } catch {
    // Preserve the old value so a later launch can retry migration.
    return legacyEntry.entry;
  }
  await storage.removeItem(legacyStorageKey).catch(() => undefined);
  return legacyEntry.entry;
}

/** Persists a value with the write timestamp required for stale-data disclosure. */
export async function setPersistedCache<T>(key: string, value: T): Promise<void> {
  const entry: CachedEntry<T> = {
    data: value,
    timestamp: Date.now()
  };
  const storage = await getStorage();
  await storage.setItem(CACHE_STORAGE_NAMESPACE + key, JSON.stringify(entry));
}

/** Rewrites an existing entry with its offline marker while retaining the original timestamp. */
export async function markCacheAsOffline<T>(key: string): Promise<void> {
  const entry = await getPersistedCacheEntry<T>(key);
  if (!entry) return;
  
  const storage = await getStorage();
  const offlineEntry: CachedEntry<T> = {
    ...entry,
    isOffline: true
  };
  await storage.setItem(CACHE_STORAGE_NAMESPACE + key, JSON.stringify(offlineEntry));
}

/** Clears persisted cache without disturbing unrelated stored state. */
export async function clearPersistedCache(key?: string): Promise<void> {
  const storage = await getStorage();

  if (key) {
    await Promise.all([
      storage.removeItem(CACHE_STORAGE_NAMESPACE + key),
      storage.removeItem(LEGACY_CACHE_STORAGE_NAMESPACE + key),
    ]);
    return;
  }

  const allKeys = await storage.getAllKeys?.();
  if (!allKeys || allKeys.length === 0) return;

  const ours = allKeys.filter((k) =>
    k.startsWith(CACHE_STORAGE_NAMESPACE) || k.startsWith(LEGACY_CACHE_STORAGE_NAMESPACE));
  if (ours.length === 0) return;

  if (storage.multiRemove) {
    await storage.multiRemove(ours);
    return;
  }

  await Promise.all(ours.map((k) => storage.removeItem(k)));
}

export type OfflineFetchResult<T> = {
  data: T;
  fromCache: boolean;
  isOffline: boolean;
  cacheAge: number | null;
};

/** Attempts network first, returning validated cache only for transient failures within the age limit. */
export async function fetchNetworkFirstWithFallback<T>(
  key: string,
  loader: () => Promise<T>,
  validator?: CacheValidator<T>
): Promise<OfflineFetchResult<T>> {
  // Storage is an optional acceleration/offline layer. A read outage must not
  // prevent a healthy network request from proceeding.
  const cachedEntry = await getPersistedCacheEntry<T>(key, validator).catch(() => null);

  try {
    const freshData = await loader();

    // A storage outage must not discard a successful network response.
    await setPersistedCache(key, freshData).catch(() => undefined);

    return {
      data: freshData,
      fromCache: false,
      isOffline: false,
      cacheAge: null
    };
  } catch (error: unknown) {
    const fallback = await getTransientCacheFallback(key, cachedEntry, error);
    if (fallback) return fallback;
    throw error;
  }
}

/** Returns a fresh-enough cached result only for failures safe to treat as transient. */
async function getTransientCacheFallback<T>(
  key: string,
  cachedEntry: CachedEntry<T> | null,
  error: unknown
): Promise<OfflineFetchResult<T> | null> {
  if (!cachedEntry || !isTransientFailure(error)) return null;

  const cacheAge = Math.max(0, Date.now() - cachedEntry.timestamp);
  if (cacheAge > OFFLINE_CACHE_MAX_AGE_MS) return null;

  await markCacheAsOffline<T>(key).catch(() => undefined);
  return {
    data: cachedEntry.data,
    fromCache: true,
    isOffline: true,
    cacheAge
  };
}

/** Allows fallback only for rate-limit and server failures that are not known validation mismatches. */
function isRetryableResponseError(error: HttpError | ApiErrorException): boolean {
  return !NON_RETRYABLE_ERROR_CODES.has(error.code) && (error.status === 429 || error.status >= 500);
}

/** Classifies timeout, transport, and retryable HTTP failures as eligible for cached fallback. */
function isTransientFailure(error: unknown): boolean {
  if (error instanceof RequestTimeoutError || error instanceof TypeError) return true;
  if (error instanceof HttpError || error instanceof ApiErrorException) return isRetryableResponseError(error);
  return false;
}

/** Reports whether the saved entry was produced by a network-failure fallback. */
export async function isOfflineData(key: string): Promise<boolean> {
  const entry = await getPersistedCacheEntry<unknown>(key);
  return entry?.isOffline ?? false;
}

/** Get cache statistics for diagnostics screens and tests. */
export async function getCacheStats(): Promise<{
  keyCount: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  offlineKeys: string[];
}> {
  const storage = await getStorage();
  const allKeys = await storage.getAllKeys?.() ?? [];
  const ourKeys = allKeys.filter(k => k.startsWith(CACHE_STORAGE_NAMESPACE));
  const stats = createCacheStats(ourKeys.length);

  for (const key of ourKeys) {
    updateCacheStats(stats, key, await storage.getItem(key));
  }

  return stats;
}

type CacheStats = {
  keyCount: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  offlineKeys: string[];
};

function createCacheStats(keyCount: number): CacheStats {
  return { keyCount, oldestEntry: null, newestEntry: null, offlineKeys: [] };
}

/** Incorporates a readable cache envelope into diagnostics and ignores malformed values. */
function updateCacheStats(stats: CacheStats, key: string, raw: string | null): void {
  const entry = parseCacheStatsEntry(raw);
  if (!entry) return;

  if (stats.oldestEntry === null || entry.timestamp < stats.oldestEntry) {
    stats.oldestEntry = entry.timestamp;
  }
  if (stats.newestEntry === null || entry.timestamp > stats.newestEntry) {
    stats.newestEntry = entry.timestamp;
  }
  if (entry.isOffline) stats.offlineKeys.push(key.replace(CACHE_STORAGE_NAMESPACE, ""));
}

function parseCacheStatsEntry(raw: string | null): CachedEntry<unknown> | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedEntry<unknown>;
  } catch {
    // Diagnostics must tolerate malformed values without failing the cache view.
    return null;
  }
}
