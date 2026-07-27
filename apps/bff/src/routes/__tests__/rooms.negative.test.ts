/** Covers invalid room-route requests and configuration failures. */

import { describe, expect, it } from "vitest";
import { handleRooms } from "../rooms";
import institution from "../../__fixtures__/institution.public.json";
import { expectRoomsCollection, invokeRoute } from "../../__tests__/httpMocks";

describe("GET /rooms: negative paths", () => {
  it("handles invalid limit query param (non-numeric)", async () => {
    const result = await invokeRoute(handleRooms, institution, "/rooms?limit=abc");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
  });

  it("handles negative offset query param", async () => {
    const result = await invokeRoute(handleRooms, institution, "/rooms?offset=-1");

    expect(result.status).toBe(200);
    expect(result.body).toHaveProperty("rooms");
  });

  it("handles negative limit query param", async () => {
    const result = await invokeRoute(handleRooms, institution, "/rooms?limit=-5");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
  });

  it("returns 404 when institution has no rooms configured", async () => {
    const noRoomsInstitution = {
      ...institution,
      publicRooms: []
    };
    const result = await invokeRoute(handleRooms, noRoomsInstitution, "/rooms");

    expect(result.status).toBe(404);
    expect(result.body.error.code).toBe("not_found");
  });

  it("response body matches expected rooms schema shape", async () => {
    const result = await invokeRoute(handleRooms, institution, "/rooms");

    expect(result.status).toBe(200);
    expectRoomsCollection(result.body);
    for (const room of result.body.rooms) {
      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("name");
      expect(room).toHaveProperty("campusId");
    }
  });

  it("filters by non-existent campus returns empty rooms", async () => {
    const result = await invokeRoute(handleRooms, institution, "/rooms?campus=nonexistent");

    expect(result.status).toBe(200);
    expect(result.body.rooms).toEqual([]);
  });

  it("handles extremely large limit parameter", async () => {
    const result = await invokeRoute(handleRooms, institution, "/rooms?limit=999999999");

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("bad_request");
  });
});
