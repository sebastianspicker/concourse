/** Thin shared chrome status so screens can publish a header freshness tag without coupling. */
import { useCallback, useSyncExternalStore } from "react";
import type { LampShape } from "@/design-system/StatusLamp";

export type ChromeStatusTone = "success" | "warning" | "error" | "muted";

export type ChromeStatus = { label: string; tone: ChromeStatusTone; lamp: LampShape } | null;

type ChromeStatusStore = {
  getSnapshot: () => ChromeStatus;
  setStatus: (status: ChromeStatus) => void;
  subscribe: (listener: () => void) => () => void;
};

function isSameStatus(current: ChromeStatus, next: ChromeStatus): boolean {
  if (current === next) return true;
  if (current === null || next === null) return false;
  return current.label === next.label && current.tone === next.tone && current.lamp === next.lamp;
}

/** Creates the status store that backs the app-wide chrome tag. */
function createChromeStatusStore(initial: ChromeStatus = null): ChromeStatusStore {
  let status: ChromeStatus = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => status,
    setStatus: (next) => {
      if (isSameStatus(status, next)) return;
      status = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** App-wide store so header and screens share status without a required root wrap. */
const globalStore = createChromeStatusStore();

/** Returns the current chrome freshness/status payload (null = hidden). */
export function useChromeStatus(): ChromeStatus {
  return useSyncExternalStore(globalStore.subscribe, globalStore.getSnapshot, globalStore.getSnapshot);
}

/** Returns a stable setter Today (and others) can call to publish header status. */
export function useSetChromeStatus(): (status: ChromeStatus) => void {
  return useCallback((status: ChromeStatus) => globalStore.setStatus(status), []);
}
