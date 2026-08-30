/** Thin shared chrome status so screens can publish a header freshness chip without coupling. */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ChromeStatusTone = "success" | "warning" | "error" | "muted";

export type ChromeStatus = { label: string; tone: ChromeStatusTone } | null;

type ChromeStatusStore = {
  getSnapshot: () => ChromeStatus;
  setStatus: (status: ChromeStatus) => void;
  subscribe: (listener: () => void) => () => void;
};

/** Creates an isolated status store (tests) or backs the default global store. */
function createChromeStatusStore(initial: ChromeStatus = null): ChromeStatusStore {
  let status: ChromeStatus = initial;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => status,
    setStatus: (next) => {
      const same =
        status === next ||
        (status !== null &&
          next !== null &&
          status.label === next.label &&
          status.tone === next.tone);
      if (same) return;
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

/** App-wide default store so header and screens share status without a required root wrap. */
const globalStore = createChromeStatusStore();

const ChromeStatusStoreContext = createContext<ChromeStatusStore>(globalStore);

/**
 * Optional provider for an isolated store (tests or nested scopes).
 * Omitting it still works via the module-level global store.
 */
export function ChromeStatusProvider({ children }: { children: ReactNode }): JSX.Element {
  const [store] = useState(() => createChromeStatusStore());
  return (
    <ChromeStatusStoreContext.Provider value={store}>{children}</ChromeStatusStoreContext.Provider>
  );
}

/** Returns the current chrome freshness/status chip payload (null = hidden). */
export function useChromeStatus(): ChromeStatus {
  const store = useContext(ChromeStatusStoreContext);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/** Returns a stable setter Today (and others) can call to publish header chip status. */
export function useSetChromeStatus(): (status: ChromeStatus) => void {
  const store = useContext(ChromeStatusStoreContext);
  return useCallback((status: ChromeStatus) => store.setStatus(status), [store]);
}
