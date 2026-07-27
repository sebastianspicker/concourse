/** Verifies connectivity updates and offline-entry age are reflected in hook state. */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act } from "react-test-renderer";
import type { NetInfoState } from "@react-native-community/netinfo";
import { renderHook } from "./testUtils";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: null,
}));

// NetInfo mock
const mockNetInfoListeners: Array<(state: Partial<NetInfoState>) => void> = [];
const mockNetInfoFetch = vi.fn().mockResolvedValue({ isConnected: true });

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    fetch: () => mockNetInfoFetch(),
    addEventListener: (cb: (state: Partial<NetInfoState>) => void) => {
      mockNetInfoListeners.push(cb);
      return () => {
        const idx = mockNetInfoListeners.indexOf(cb);
        if (idx !== -1) mockNetInfoListeners.splice(idx, 1);
      };
    },
  },
}));

// persistedCache mock
vi.mock("../../data/persistedCache", () => ({
  getCacheStats: vi.fn().mockResolvedValue({
    keyCount: 0,
    oldestEntry: null,
    newestEntry: null,
    offlineKeys: [],
  }),
}));

import { useOfflineCache } from "../useOfflineCache";
import { getCacheStats } from "../../data/persistedCache";

/** Delivers a mocked NetInfo transition to every subscribed offline-cache listener. */
function fireNetInfo(isConnected: boolean) {
  for (const listener of mockNetInfoListeners) {
    listener({ isConnected });
  }
}

async function renderReadyOfflineCache() {
  const hook = renderHook(() => useOfflineCache());
  await hook.flush();
  return hook;
}

async function setConnection(getResult: () => ReturnType<typeof useOfflineCache>, isConnected: boolean): Promise<void> {
  await act(async () => {
    fireNetInfo(isConnected);
  });
  expect(getResult().isOffline).toBe(!isConnected);
}

describe("useOfflineCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    mockNetInfoListeners.length = 0;
    vi.mocked(getCacheStats).mockResolvedValue({
      keyCount: 0,
      oldestEntry: null,
      newestEntry: null,
      offlineKeys: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts with isOffline=false when connected", async () => {
    const { getResult } = await renderReadyOfflineCache();
    expect(getResult().isOffline).toBe(false);
  });

  it("sets isOffline=true when NetInfo reports disconnected", async () => {
    const { getResult } = await renderReadyOfflineCache();

    await setConnection(getResult, false);
  });

  it("sets isOffline=false again when NetInfo reports reconnected", async () => {
    const { getResult } = await renderReadyOfflineCache();

    await setConnection(getResult, false);
    await setConnection(getResult, true);
  });

  it("hasOfflineData=false when no offline keys", async () => {
    const { getResult } = await renderReadyOfflineCache();
    expect(getResult().hasOfflineData).toBe(false);
  });

  it("hasOfflineData=true when getCacheStats returns offline keys", async () => {
    vi.mocked(getCacheStats).mockResolvedValue({
      keyCount: 2,
      oldestEntry: Date.now() - 5000,
      newestEntry: Date.now() - 1000,
      offlineKeys: ["events", "rooms"],
    });

    const { getResult } = await renderReadyOfflineCache();

    expect(getResult().hasOfflineData).toBe(true);
    expect(getResult().cacheAge).toBeGreaterThanOrEqual(0);
  });

  it("checkOfflineStatus refreshes hasOfflineData", async () => {
    const { getResult } = await renderReadyOfflineCache();
    expect(getResult().hasOfflineData).toBe(false);

    vi.mocked(getCacheStats).mockResolvedValue({
      keyCount: 1,
      oldestEntry: Date.now() - 3000,
      newestEntry: Date.now() - 3000,
      offlineKeys: ["schedule"],
    });

    await act(async () => {
      await getResult().checkOfflineStatus();
    });

    expect(getResult().hasOfflineData).toBe(true);
  });
});
