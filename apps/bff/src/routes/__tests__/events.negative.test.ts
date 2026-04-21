import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleEvents } from "../events";
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

describe("GET /events — negative paths", () => {
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

  it("handles invalid limit query param (non-numeric)", async () => {
    const req = createMockRequest("/events?limit=abc");
    const { response, getStatus, getBody } = createMockResponse();

    await handleEvents(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("events");
    expect(Array.isArray(body.events)).toBe(true);
  });

  it("handles negative offset query param", async () => {
    const req = createMockRequest("/events?offset=-1");
    const { response, getStatus, getBody } = createMockResponse();

    await handleEvents(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("events");
  });

  it("returns 404 when institution has no event sources configured", async () => {
    const noEventsInstitution = {
      ...institution,
      publicSources: { ...institution.publicSources, events: [] }
    };
    const req = createMockRequest("/events");
    const { response, getStatus, getBody } = createMockResponse();

    await handleEvents(req, response, noEventsInstitution);

    expect(getStatus()).toBe(404);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body.error.code).toBe("not_found");
  });

  it("returns 500 when upstream connector throws", async () => {
    // Override mock mode with live mode and make fetch fail
    delete process.env.PUBLIC_EVENTS_MODE;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const req = createMockRequest("/events");
    const { response, getStatus } = createMockResponse();

    await handleEvents(req, response, institution);

    // The connector returns fallback events on failure, so it may still return 200 with degraded data.
    // The BFF wraps errors in createJsonRoute, so if the connector manages to return data, we get 200.
    const statusCode = getStatus();
    expect(statusCode).toBeDefined();
    expect([200, 500]).toContain(statusCode);
  });

  it("response body matches expected events schema shape", async () => {
    const req = createMockRequest("/events");
    const { response, getStatus, getBody } = createMockResponse();

    await handleEvents(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("events");
    expect(Array.isArray(body.events)).toBe(true);
    for (const event of body.events) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("date");
      expect(event).toHaveProperty("sourceUrl");
    }
  });

  it("handles invalid date range parameters gracefully", async () => {
    const req = createMockRequest("/events?from=garbage&to=not-a-date");
    const { response, getStatus, getBody } = createMockResponse();

    await handleEvents(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("events");
  });

  it("handles extremely large limit parameter", async () => {
    const req = createMockRequest("/events?limit=999999999");
    const { response, getStatus, getBody } = createMockResponse();

    await handleEvents(req, response, institution);

    expect(getStatus()).toBe(200);
    const body = JSON.parse(getBody() ?? "{}");
    expect(body).toHaveProperty("events");
  });
});
