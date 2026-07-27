/** Exercises public room-route filtering and successful responses. */

import { describe, expect, it } from "vitest";
import { handleRooms } from "../rooms";
import institution from "../../__fixtures__/institution.public.json";
import roomsFixture from "../../__fixtures__/rooms.json";
import { invokeRoute } from "../../__tests__/httpMocks";

describe("GET /rooms", () => {
  it("returns public rooms from the institution pack", async () => {
    const result = await invokeRoute(handleRooms, institution);

    expect(result.status).toBe(200);
    expect(result.body).toEqual(roomsFixture);
  });

  it("includes _total equal to rooms array length", async () => {
    const result = await invokeRoute(handleRooms, institution);

    expect(result.status).toBe(200);
    expect(result.body._total).toBe(result.body.rooms.length);
  });
});
