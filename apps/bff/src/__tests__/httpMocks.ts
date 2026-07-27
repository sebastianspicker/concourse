/** Shared in-memory HTTP request and response doubles for route-level tests. */

import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { expect, vi } from "vitest";

export type MockHttpResponse = {
  response: ServerResponse;
  getBody: () => string | undefined;
  getHeaders: () => Readonly<Record<string, string>>;
  getStatus: () => number | undefined;
};

type RouteHandler<Institution> = (
  request: IncomingMessage,
  response: ServerResponse,
  institution: Institution
) => Promise<void> | void;

/** Captures status, headers, and a text body without opening a listener. */
export function createMockResponse(options: { headersSent?: boolean; initialStatus?: number; writableEnded?: boolean } = {}): MockHttpResponse {
  let body = "";
  let status = options.initialStatus ?? 0;
  const headers: Record<string, string> = {};

  const response = {
    get headersSent() { return options.headersSent ?? false; },
    get writableEnded() { return options.writableEnded ?? false; },
    setHeader(name: string, value: string | number | readonly string[]) {
      headers[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
      return response;
    },
    writeHead(code: number, suppliedHeaders?: Record<string, string>) {
      status = code;
      if (suppliedHeaders) Object.entries(suppliedHeaders).forEach(([name, value]) => response.setHeader(name, value));
      return response;
    },
    end(chunk?: string | Uint8Array) {
      body = typeof chunk === "string" ? chunk : chunk?.toString() ?? "";
      return response;
    }
  } as unknown as ServerResponse;

  return {
    response,
    getBody: () => body,
    getHeaders: () => headers,
    getStatus: () => status
  };
}

/** Builds the minimal request shape consumed by route handlers. */
export function createMockRequest(url = "/", method = "GET", headers: Record<string, string> = {}, remoteAddress?: string): IncomingMessage {
  return {
    headers: { host: "localhost:4000", ...headers },
    method,
    socket: remoteAddress ? { remoteAddress } : undefined,
    url
  } as unknown as IncomingMessage;
}

/** Creates paired request and response doubles for middleware and listener tests. */
export function createMockReqRes(options: {
  headers?: Record<string, string>;
  initialStatus?: number;
  method?: string;
  remoteAddress?: string;
  url?: string;
  response?: { headersSent?: boolean; writableEnded?: boolean };
} = {}) {
  const capture = createMockResponse({
    ...options.response,
    ...(options.initialStatus === undefined ? {} : { initialStatus: options.initialStatus })
  });
  return {
    capture,
    request: createMockRequest(options.url, options.method, options.headers ?? {}, options.remoteAddress),
    response: capture.response
  };
}

/** Stubs the shared schedule ICS fixture and clears the connector cache. */
export function stubScheduleFixtureFetch(clearCache: () => void) {
  clearCache();
  const ics = readFileSync(new URL("../__fixtures__/schedule.ics", import.meta.url), "utf8");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => null },
    body: null,
    text: async () => ics
  }));
}

/** Sets and restores the public-event mock environment shared by route tests. */
export function usePublicEventsMockEnvironment(clearCache: () => void) {
  process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";
  process.env.PUBLIC_EVENTS_MODE = "mock";
  clearCache();
}

export function clearPublicEventsMockEnvironment() {
  vi.unstubAllGlobals();
  delete process.env.PUBLIC_EVENTS_DATE;
  delete process.env.PUBLIC_EVENTS_MODE;
}

export function expectNotFound(body: { error: { code: string } }) {
  expect(body.error.code).toBe("not_found");
}

export function expectNotFoundRoute(status: number | undefined, body: { error: { code: string } }) {
  expect(status).toBe(404);
  expectNotFound(body);
}

export function expectEventFields(events: Array<Record<string, unknown>>) {
  for (const event of events) {
    expect(event).toHaveProperty("id");
    expect(event).toHaveProperty("title");
    expect(event).toHaveProperty("date");
    expect(event).toHaveProperty("sourceUrl");
  }
}

export function expectRoomsCollection(body: { rooms: unknown }) {
  expect(body).toHaveProperty("rooms");
  expect(Array.isArray(body.rooms)).toBe(true);
}

export function expectCapturedError(capture: MockHttpResponse, status: number, code: string) {
  expect(capture.getStatus()).toBe(status);
  expect(JSON.parse(capture.getBody() || "{}").error.code).toBe(code);
}

export function expectErrorEnvelope(body: Record<string, unknown>) {
  expect(body).toHaveProperty("error");
  const error = body.error as Record<string, unknown>;
  expect(error).toHaveProperty("code");
  expect(error).toHaveProperty("message");
}

/** Restores optional environment variables without leaving cross-test state behind. */
export function restoreEnvironment(values: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

/** Invokes a route and returns its captured status, headers, and decoded JSON body. */
export async function invokeRoute<Institution>(
  handler: RouteHandler<Institution>,
  institution: Institution,
  url = "/",
  method = "GET"
) {
  const capture = createMockResponse();
  await handler(createMockRequest(url, method), capture.response, institution);

  return {
    body: JSON.parse(capture.getBody() ?? "{}"),
    headers: capture.getHeaders(),
    rawBody: capture.getBody(),
    status: capture.getStatus()
  };
}
