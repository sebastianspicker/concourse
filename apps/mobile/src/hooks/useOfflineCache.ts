/** Tracks connectivity, offline-marked cache presence, and the newest saved entry’s age. */
import { useState, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";
import { getCacheStats } from "../data/persistedCache";

type OfflineCacheState = {
  isOffline: boolean;
  hasOfflineData: boolean;
  cacheAge: number | null;
  checkOfflineStatus: () => Promise<void>;
};

/** Subscribes to connectivity and reports whether saved offline entries are available. */
export function useOfflineCache(): OfflineCacheState {
  const [isOffline, setIsOffline] = useState(false);
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
    let mounted = true;

    NetInfo.fetch().then((state) => {
      if (mounted) setIsOffline(!state.isConnected);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (mounted) setIsOffline(!state.isConnected);
    });

    checkOfflineStatus();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [checkOfflineStatus]);
  
  return {
    isOffline,
    hasOfflineData,
    cacheAge,
    checkOfflineStatus
  };
}
