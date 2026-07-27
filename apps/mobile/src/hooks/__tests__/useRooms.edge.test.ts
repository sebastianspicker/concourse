/** Exercises room-hook behavior for edge-case filters and failed resource responses. */
import { describe, expect } from "vitest";
import { defineResourceEdgeCases } from "./resourceTestCases";
import { useRooms } from "../useRooms";

describe("useRooms: edge cases", () => {
  defineResourceEdgeCases({
    assertEmpty: (data) => expect(data?.rooms).toEqual([]),
    emptyBody: { rooms: [] },
    emptyTestName: "returns empty rooms array without crashing on empty response",
    errorCode: "not_found",
    errorMessage: "Not found",
    errorStatus: 404,
    errorTestName: "handles 404 response from server",
    hook: useRooms
  });
});
