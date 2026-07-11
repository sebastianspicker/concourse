import AsyncStorage from "@react-native-async-storage/async-storage";

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys?: () => Promise<readonly string[]>;
  multiRemove?: (keys: readonly string[]) => Promise<void>;
};

const CACHE_STORAGE_NAMESPACE = "campus-app-kit:";
const memory = new Map<string, string>();

export type CachedEntry<T> = {
  data: T;
  timestamp: number;
  isOffline?: boolean;
};

// Public campus data is useful offline, but stale schedules/events can mislead
// users. After this window, network errors should be surfaced instead.
export const OFFLINE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function getStorage(): Promise<StorageLike> {
  const fallbackStorage: StorageLike = {
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

  // Try to use AsyncStorage directly (native), but fall back if the JS object
  // exists without a working native backing implementation.
  if (
    AsyncStorage &&
    typeof AsyncStorage === "object" &&
    typeof AsyncStorage.getItem === "function"
  ) {
    try {
      await AsyncStorage.getItem(`${CACHE_STORAGE_NAMESPACE}__probe__`);
      return AsyncStorage as StorageLike;
    } catch {
      return fallbackStorage;
    }
  }

  return fallbackStorage;
}

export async function getPersistedCache<T>(key: string): Promise<T | null> {
  const entry = await getPersistedCacheEntry<T>(key);
  return entry?.data ?? null;
}

export async function getPersistedCacheEntry<T>(key: string): Promise<CachedEntry<T> | null> {
  const storage = await getStorage();
  const raw = await storage.getItem(CACHE_STORAGE_NAMESPACE + key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedEntry<T>;
  } catch {
    return null;
  }
}

export async function setPersistedCache<T>(key: string, value: T): Promise<void> {
  const entry: CachedEntry<T> = {
    data: value,
    timestamp: Date.now()
  };
  const storage = await getStorage();
  await storage.setItem(CACHE_STORAGE_NAMESPACE + key, JSON.stringify(entry));
}

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

export async function getCacheAge(key: string): Promise<number | null> {
  const entry = await getPersistedCacheEntry<unknown>(key);
  if (!entry) return null;
  return Date.now() - entry.timestamp;
}

export async function isCacheStale(key: string, maxAgeMs: number): Promise<boolean> {
  const age = await getCacheAge(key);
  if (age === null) return true;
  return age > maxAgeMs;
}

export async function clearPersistedCache(key?: string): Promise<void> {
  const storage = await getStorage();

  if (key) {
    await storage.removeItem(CACHE_STORAGE_NAMESPACE + key);
    return;
  }

  const allKeys = await storage.getAllKeys?.();
  if (!allKeys || allKeys.length === 0) return;

  const ours = allKeys.filter((k) => k.startsWith(CACHE_STORAGE_NAMESPACE));
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

/**
 * Fetch with network-first strategy, falling back to persisted cache on failure.
 *
 * Despite the name, this function always attempts a network fetch first.
 * If the network call succeeds, the result is persisted and returned.
 * If the network call fails and cached data exists, the cached data is
 * returned (marked as offline). If no cache exists, the error is re-thrown.
 *
 * This is a network-first strategy with cache fallback, not offline-first
 * (which would return cache immediately and refresh in the background).
 */
export async function fetchNetworkFirstWithFallback<T>(
  key: string,
  loader: () => Promise<T>
): Promise<OfflineFetchResult<T>> {
  const cachedEntry = await getPersistedCacheEntry<T>(key);
  const now = Date.now();

  try {
    const freshData = await loader();

    await setPersistedCache(key, freshData);

    return {
      data: freshData,
      fromCache: false,
      isOffline: false,
      cacheAge: null
    };
  } catch (error: unknown) {
    if (cachedEntry) {
      const cacheAge = now - cachedEntry.timestamp;
      if (cacheAge > OFFLINE_CACHE_MAX_AGE_MS) {
        throw error;
      }

      await markCacheAsOffline<T>(key);

      return {
        data: cachedEntry.data,
        fromCache: true,
        isOffline: true,
        cacheAge
      };
    }

    throw error;
  }
}

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
  
  let oldest: number | null = null;
  let newest: number | null = null;
  const offlineKeys: string[] = [];
  
  for (const key of ourKeys) {
    const raw = await storage.getItem(key);
    if (raw) {
      try {
        const entry = JSON.parse(raw) as CachedEntry<unknown>;
        if (oldest === null || entry.timestamp < oldest) oldest = entry.timestamp;
        if (newest === null || entry.timestamp > newest) newest = entry.timestamp;
        if (entry.isOffline) {
          offlineKeys.push(key.replace(CACHE_STORAGE_NAMESPACE, ""));
        }
      } catch {
        // Skip invalid entries
      }
    }
  }
  
  return {
    keyCount: ourKeys.length,
    oldestEntry: oldest,
    newestEntry: newest,
    offlineKeys
  };
}
