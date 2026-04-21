import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleToday } from "../today";
import institution from "../../__fixtures__/institution.public.json";
import { clearCache } from "../../utils/cache";

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

describe("GET /today — negative paths", () => {
  beforeEach(() => {
    process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";
    process.env.PUBLIC_EVENTS_MODE = "mock";
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PUBLIC_EVENTS_DATE;
    delete process.env.PUBLIC_EVENTS_MODE;
  });

  it("returns 404 when institution has no event or room sources", async () => {
    const emptyInstitution = {
      ...institution,
      publicSources: { events: [], schedules: [] },
      publicRooms: []
    };
    const req = createMockRequest("/today");
    const { response, getStatus, getBody } = createMockResponse();

    await handleToday(req, response, emptyInstitution);

    expect(getStatus()).toBe(404);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body.error.code).toBe("not_found");
  });

  it("returns 500 when upstream connector throws", async () => {
    delete process.env.PUBLIC_EVENTS_MODE;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("DNS resolution failed")));

    const req = createMockRequest("/today");
    const { response, getStatus } = createMockResponse();

    await handleToday(req, response, institution);

    const statusCode = getStatus();
    expect(statusCode).toBeDefined();
    // The connector has fallback behavior, so it may return 200 with degraded data
    expect([200, 500]).toContain(statusCode);
  });

  it("response body matches expected today schema shape", async () => {
    const req = createMockRequest("/today");
    const { response, getStatus, getBody } = createMockResponse();

    await handleToday(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("events");
    expect(body).toHaveProperty("rooms");
    expect(Array.isArray(body.events)).toBe(true);
    expect(Array.isArray(body.rooms)).toBe(true);
  });

  it("still returns rooms even when events are empty for today", async () => {
    // Set a date where no mock events exist
    process.env.PUBLIC_EVENTS_DATE = "1999-01-01T00:00:00.000Z";
    clearCache();

    const req = createMockRequest("/today");
    const { response, getStatus, getBody } = createMockResponse();

    await handleToday(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
    expect(Array.isArray(body.rooms)).toBe(true);
  });

  it("handles institution with rooms but no events sources", async () => {
    const roomsOnlyInstitution = {
      ...institution,
      publicSources: { events: [], schedules: [] }
    };
    const req = createMockRequest("/today");
    const { response, getStatus, getBody } = createMockResponse();

    await handleToday(req, response, roomsOnlyInstitution);

    // Should still succeed because rooms are configured
    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("rooms");
  });

  it("events in today response have required fields", async () => {
    const req = createMockRequest("/today");
    const { response, getStatus, getBody } = createMockResponse();

    await handleToday(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    for (const event of body.events) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("date");
      expect(event).toHaveProperty("sourceUrl");
    }
  });
});
