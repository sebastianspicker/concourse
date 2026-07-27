/** Verifies structured BFF error response serialization. */

import { describe, expect, it, vi } from "vitest";
import { createMockResponse } from "../../__tests__/httpMocks";
import { sendError } from "../errors";

describe("sendError", () => {
  it("sends JSON error response with correct status code", () => {
    const capture = createMockResponse();
    sendError(capture.response, 404, "not_found", "Route not found");

    expect(capture.getStatus()).toBe(404);
    const body = JSON.parse(capture.getBody() ?? "{}");
    expect(body).toEqual({
      error: { code: "not_found", message: "Route not found" }
    });
  });

  it("sets content-type header", () => {
    const capture = createMockResponse();
    sendError(capture.response, 500, "internal_error", "Unexpected error");

    expect(capture.getHeaders()["content-type"]).toBe("application/json");
  });

  it("sets cache-control no-store on error responses", () => {
    const capture = createMockResponse();
    sendError(capture.response, 400, "bad_request", "Invalid input");

    expect(capture.getHeaders()["cache-control"]).toBe("no-store");
  });

  it("handles already-sent headers gracefully", () => {
    const capture = createMockResponse({ headersSent: true });
    sendError(capture.response, 500, "internal_error", "Unexpected error");

    expect(capture.getStatus()).toBe(0);
  });

  it("ends response when headers sent and stream not ended", () => {
    const capture = createMockResponse({ headersSent: true });
    const endSpy = vi.spyOn(capture.response, "end");
    sendError(capture.response, 500, "internal_error", "Unexpected error");

    expect(endSpy).toHaveBeenCalled();
  });
});
