/** Tracks connectivity, valid saved public data, and the newest entry's age. */
import { useState, useEffect, useCallback, useRef } from "react";
import { AppState } from "react-native";
import { getCacheStats, OFFLINE_CACHE_MAX_AGE_MS, subscribePersistedCacheMutations } from "./persistedCache";
import { useNetworkStatus } from "@/platform/network/useNetworkStatus";
import { createLatestResultGuard } from "./requestGuard";

type OfflineCacheState = {
  isOffline: boolean;
  hasOfflineData: boolean;
  cacheAge: number | null;
  checkOfflineStatus: () => Promise<void>;
};

/** Subscribes to connectivity and reports whether saved offline entries are available. */
export function useOfflineCache(): OfflineCacheState {
  const isOffline = useNetworkStatus();
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [nextExpiryAt, setNextExpiryAt] = useState<number | null>(null);
  const resultGuard = useRef<ReturnType<typeof createLatestResultGuard> | null>(null);
  resultGuard.current ??= createLatestResultGuard();
  
  const checkOfflineStatus = useCallback(async () => {
    const request = resultGuard.current!.begin();
    try {
      const stats = await getCacheStats();
      if (!resultGuard.current!.accepts(request)) return;
      setHasOfflineData(stats.keyCount > 0);
      
      if (stats.keyCount > 0 && stats.newestEntry) {
        setCacheAge(Date.now() - stats.newestEntry);
      } else {
        setCacheAge(null);
      }
      setNextExpiryAt(stats.oldestEntry === null ? null : stats.oldestEntry + OFFLINE_CACHE_MAX_AGE_MS + 1);
    } catch {
      // Cache statistics are best-effort and must not block connectivity updates.
    }
  }, []);

  useEffect(() => {
    resultGuard.current!.mount();
    return () => resultGuard.current!.unmount();
  }, []);
  
  useEffect(() => {
    return subscribePersistedCacheMutations(() => { void checkOfflineStatus(); });
  }, [checkOfflineStatus]);

  useEffect(() => {
    void checkOfflineStatus();
  }, [checkOfflineStatus, isOffline]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkOfflineStatus();
    });
    return () => subscription.remove();
  }, [checkOfflineStatus]);

  useEffect(() => {
    if (nextExpiryAt === null) return;
    const timeout = setTimeout(() => { void checkOfflineStatus(); }, Math.max(0, nextExpiryAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [checkOfflineStatus, nextExpiryAt]);
  
  return {
    isOffline,
    hasOfflineData,
    cacheAge,
    checkOfflineStatus
  };
}
