/** Verifies serialized API responses stay within the public transport budget. */

import { describe, expect, it } from "vitest";
import { createMockRequest, createMockResponse } from "../testing/httpMocks";
import {
  MAX_JSON_RESPONSE_BYTES,
  ResponseBodyTooLargeError,
  sendJsonWithCache
} from "./cacheResponse";

describe("sendJsonWithCache", () => {
  it("counts the final JSON in UTF-8 and rejects it before setting response headers", () => {
    const capture = createMockResponse();

    expect(() => sendJsonWithCache(
      createMockRequest(),
      capture.response,
      { description: "é".repeat(Math.ceil(MAX_JSON_RESPONSE_BYTES / 2)) }
    )).toThrow(ResponseBodyTooLargeError);

    expect(capture.getStatus()).toBe(0);
    expect(capture.getHeaders()).toEqual({});
    expect(capture.getBody()).toBe("");
  });
});
