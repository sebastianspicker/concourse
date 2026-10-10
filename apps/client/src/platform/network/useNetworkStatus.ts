import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export type NetworkStatusListener = (offline: boolean, previousOffline: boolean | undefined) => void;

const listeners = new Set<NetworkStatusListener>();
let currentOffline = false;
let hasObservation = false;
let observationVersion = 0;
let unsubscribeNative: (() => void) | null = null;

function publish(offline: boolean): void {
  const previous = hasObservation ? currentOffline : undefined;
  currentOffline = offline;
  hasObservation = true;
  for (const listener of listeners) listener(offline, previous);
}

function ensureObservation(): void {
  if (unsubscribeNative) return;
  const version = ++observationVersion;
  void NetInfo.fetch()
    .then((state) => {
      if (version === observationVersion) publish(!state.isConnected);
    })
    .catch(() => undefined);
  unsubscribeNative = NetInfo.addEventListener((state) => publish(!state.isConnected));
}

function stopObservationIfUnused(): void {
  if (listeners.size > 0) return;
  observationVersion += 1;
  unsubscribeNative?.();
  unsubscribeNative = null;
}

/** Shares one native connectivity observation among all data and presentation consumers. */
export function subscribeNetworkStatus(listener: NetworkStatusListener): () => void {
  listeners.add(listener);
  ensureObservation();
  if (hasObservation) listener(currentOffline, undefined);
  return () => {
    listeners.delete(listener);
    stopObservationIfUnused();
  };
}

export function useNetworkStatus(): boolean {
  const [isOffline, setIsOffline] = useState(currentOffline);

  useEffect(() => subscribeNetworkStatus((offline) => setIsOffline(offline)), []);
  return isOffline;
}
