/** Tracks connectivity, offline-marked cache presence, and the newest saved entry’s age. */
import { useState, useEffect, useCallback } from "react";
import { getCacheStats } from "./persistedCache";
import { useNetworkStatus } from "@/platform/network/useNetworkStatus";

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
  
  const checkOfflineStatus = useCallback(async () => {
    try {
      const stats = await getCacheStats();
      setHasOfflineData(stats.offlineKeys.length > 0);
      
      if (stats.offlineKeys.length > 0 && stats.newestEntry) {
        setCacheAge(Date.now() - stats.newestEntry);
      }
    } catch {
      // Cache statistics are best-effort and must not block connectivity updates.
    }
  }, []);
  
  useEffect(() => {
    checkOfflineStatus();
  }, [checkOfflineStatus]);
  
  return {
    isOffline,
    hasOfflineData,
    cacheAge,
    checkOfflineStatus
  };
}
