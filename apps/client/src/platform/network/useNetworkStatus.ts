import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    NetInfo.fetch().then((state) => {
      if (mounted) setIsOffline(!state.isConnected);
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (mounted) setIsOffline(!state.isConnected);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return isOffline;
}
