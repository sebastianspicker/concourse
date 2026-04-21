import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRooms } from "../rooms";
import institution from "../../__fixtures__/institution.public.json";

function createMockResponse(): {
  response: ServerResponse;
  getBody: () => string | undefined;
  getStatus: () => number | undefined;
} {
  let body: string | undefined;
  let status: number | undefined;

  const response = {
    setHeader() {
      return undefined;
    },
    writeHead(code: number) {
      status = code;
      return response;
    },
    end(chunk?: string) {
      body = chunk;
    },
    headersSent: false,
    writableEnded: false
  } as unknown as ServerResponse;

  return {
    response,
    getBody: () => body,
    getStatus: () => status
  };
}

function createMockRequest(url: string, method = "GET"): IncomingMessage {
  return {
    url,
    method,
    headers: { host: "localhost:4000" }
  } as unknown as IncomingMessage;
}

describe("GET /rooms — negative paths", () => {
  it("handles invalid limit query param (non-numeric)", async () => {
    const req = createMockRequest("/rooms?limit=abc");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
    expect(Array.isArray(body.rooms)).toBe(true);
  });

  it("handles negative offset query param", async () => {
    const req = createMockRequest("/rooms?offset=-1");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
  });

  it("handles negative limit query param", async () => {
    const req = createMockRequest("/rooms?limit=-5");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
  });

  it("returns 404 when institution has no rooms configured", async () => {
    const noRoomsInstitution = {
      ...institution,
      publicRooms: []
    };
    const req = createMockRequest("/rooms");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, noRoomsInstitution);

    expect(getStatus()).toBe(404);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body.error.code).toBe("not_found");
  });

  it("response body matches expected rooms schema shape", async () => {
    const req = createMockRequest("/rooms");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
    expect(Array.isArray(body.rooms)).toBe(true);
    for (const room of body.rooms) {
      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("name");
      expect(room).toHaveProperty("campusId");
    }
  });

  it("filters by non-existent campus returns empty rooms", async () => {
    const req = createMockRequest("/rooms?campus=nonexistent");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body.rooms).toEqual([]);
  });

  it("handles extremely large limit parameter", async () => {
    const req = createMockRequest("/rooms?limit=999999999");
    const { response, getStatus, getBody } = createMockResponse();

    await handleRooms(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
  });
});
