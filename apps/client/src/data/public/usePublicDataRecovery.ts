import { useEffect, useRef } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";
import { usePathname } from "expo-router";
import { subscribeNetworkStatus } from "@/platform/network/useNetworkStatus";
import { isStaticDemo } from "./staticDemo";
import { retryNativeStorageOnForeground } from "./persistedCache";
import { createRouteRecoveryObserver, schedulePublicDataRecovery } from "./publicDataRecovery";

/** Installs one app-wide observer for reconnect, foreground, and browser-focus recovery. */
export function usePublicDataRecovery(): void {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const pathname = usePathname();
  const routeObserver = useRef<ReturnType<typeof createRouteRecoveryObserver> | null>(null);
  routeObserver.current ??= createRouteRecoveryObserver(() => schedulePublicDataRecovery("foreground"));

  useEffect(() => {
    if (!isStaticDemo()) routeObserver.current!(pathname);
  }, [pathname]);

  useEffect(() => {
    if (isStaticDemo()) return;
    const unsubscribeNetwork = subscribeNetworkStatus((offline, previousOffline) => {
      if (previousOffline === true && !offline) schedulePublicDataRecovery("reconnect");
    });
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      const wasInactive = appState.current !== "active";
      appState.current = nextState;
      if (wasInactive && nextState === "active") {
        retryNativeStorageOnForeground();
        schedulePublicDataRecovery("foreground");
      }
    });
    const onFocus = () => {
      retryNativeStorageOnForeground();
      schedulePublicDataRecovery("foreground");
    };
    if (Platform.OS === "web" && typeof window !== "undefined") window.addEventListener("focus", onFocus);

    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
      if (Platform.OS === "web" && typeof window !== "undefined") window.removeEventListener("focus", onFocus);
    };
  }, []);
}
