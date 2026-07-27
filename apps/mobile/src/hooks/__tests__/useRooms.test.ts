/** Verifies room queries flow through the shared offline-aware resource lifecycle. */
import { describe, expect } from "vitest";
import { defineResourceSuccessCase } from "./resourceTestCases";
import { useRooms } from "../useRooms";

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
  defineResourceSuccessCase({
    assertLoaded: (data) => expect(data?.rooms.length).toBe(1),
    body: mockRooms,
    hook: useRooms,
    testName: "loads rooms",
  });
});
