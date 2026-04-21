import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "./testUtils";
import { useRooms } from "../useRooms";
import { clearCache } from "../../data/cache";
import { clearPersistedCache } from "../../data/persistedCache";
import { _resetBffBaseUrlMemoForTests } from "../../utils/bffConfig";

const mockRooms = {
  rooms: [
    {
      id: "room-1",
      name: "Room A",
      campusId: "cologne"
    }
  ]
};

describe("useRooms", () => {
  beforeEach(async () => {
    process.env.EXPO_PUBLIC_BFF_BASE_URL = "http://localhost:4000";
    _resetBffBaseUrlMemoForTests();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRooms),
      headers: { get: () => null },
    }));
    clearCache();
    await clearPersistedCache();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    delete process.env.EXPO_PUBLIC_BFF_BASE_URL;
    await clearPersistedCache();
  });

  it("loads rooms", async () => {
    const { getResult, flush, unmount } = renderHook(useRooms);

    expect(getResult().loading).toBe(true);
    await flush();

    expect(getResult().loading).toBe(false);
    expect(getResult().data?.rooms.length).toBe(1);
    unmount();
  });
});
