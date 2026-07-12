import React, { useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOfflineCache } from "../hooks/useOfflineCache";
import { OfflineBanner } from "./OfflineBanners";

type Props = {
  showCacheAge?: boolean;
};

export function OfflineIndicator({ showCacheAge = true }: Props): JSX.Element | null {
  const { isOffline } = useOfflineCache();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  // Don't show when app is in background
  if (appState !== "active") return null;

  const topPadding = Platform.OS === "ios" ? insets.top : 0;

  // Show when device is offline
  if (isOffline) {
    return (
      <OfflineBanner
        topPadding={topPadding}
        hasOfflineData={false}
        showCacheAge={showCacheAge}
      />
    );
  }

  return null;
}
