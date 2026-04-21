import { describe, expect, it, vi } from "vitest";
import { sendError } from "../errors";

function createMockResponse(overrides?: { headersSent?: boolean; writableEnded?: boolean }) {
  let statusCode = 0;
  let body = "";
  const headers: Record<string, string> = {};

  const res = {
    get headersSent() { return overrides?.headersSent ?? false; },
    get writableEnded() { return overrides?.writableEnded ?? false; },
    writeHead(status: number, hdrs?: Record<string, string>) {
      statusCode = status;
      if (hdrs) Object.assign(headers, hdrs);
      return res;
    },
    setHeader(key: string, value: string) {
      headers[key] = value;
      return res;
    },
    end(data?: string) {
      if (data) body = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getBody: () => body,
    getHeaders: () => headers,
  };

  return res;
}

describe("sendError", () => {
  it("sends JSON error response with correct status code", () => {
    const res = createMockResponse();
    sendError(res as never, 404, "not_found", "Route not found");

    expect(res.getStatusCode()).toBe(404);
    const body = JSON.parse(res.getBody());
    expect(body).toEqual({
      error: { code: "not_found", message: "Route not found" }
    });
  });

  it("sets content-type header", () => {
    const res = createMockResponse();
    sendError(res as never, 500, "internal_error", "Unexpected error");

    expect(res.getHeaders()["content-type"]).toBe("application/json");
  });

  it("sets cache-control no-store on error responses", () => {
    const res = createMockResponse();
    sendError(res as never, 400, "bad_request", "Invalid input");

    expect(res.getHeaders()["cache-control"]).toBe("no-store");
  });

  it("handles already-sent headers gracefully", () => {
    const res = createMockResponse({ headersSent: true });
    sendError(res as never, 500, "internal_error", "Unexpected error");

    expect(res.getStatusCode()).toBe(0);
  });

  it("ends response when headers sent and stream not ended", () => {
    const res = createMockResponse({ headersSent: true });
    const endSpy = vi.spyOn(res, "end");
    sendError(res as never, 500, "internal_error", "Unexpected error");

    expect(endSpy).toHaveBeenCalled();
  });
});
