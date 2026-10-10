/** Shared in-memory HTTP request and response doubles for route-level tests. */

import type { IncomingMessage, ServerResponse } from "node:http";
import { expect } from "vitest";

export type MockHttpResponse = {
  response: ServerResponse;
  getBody: () => string | undefined;
  getHeaders: () => Readonly<Record<string, string>>;
  getStatus: () => number | undefined;
};

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

export function expectCapturedError(capture: MockHttpResponse, status: number, code: string) {
  expect(capture.getStatus()).toBe(status);
  expect(JSON.parse(capture.getBody() || "{}").error.code).toBe(code);
}

