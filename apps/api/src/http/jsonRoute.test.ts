/** Locks typed application-error mapping at the HTTP boundary. */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { InvalidQueryParameterError, NoConfiguredSourcesError } from "../application/errors";
import { createMockRequest, createMockResponse } from "../testing/httpMocks";
import { MAX_JSON_RESPONSE_BYTES } from "./cacheResponse";
import { createJsonRoute } from "./jsonRoute";

describe("createJsonRoute expected application errors", () => {
  it("maps missing configured sources to the existing 404 wire response", async () => {
    const route = createJsonRoute(async () => { throw new NoConfiguredSourcesError("No event sources configured"); }, z.object({}));
    const capture = createMockResponse();
    await route(createMockRequest(), capture.response, {} as never, "typed-error-test-1");
    expect(capture.getStatus()).toBe(404);
    expect(JSON.parse(capture.getBody() ?? "{}")).toEqual({ error: { code: "not_found", message: "No event sources configured" } });
  });

  it("maps invalid decoded query values to the existing 400 wire response", async () => {
    const route = createJsonRoute(async () => { throw new InvalidQueryParameterError("limit must be an integer between 1 and 1000"); }, z.object({}));
    const capture = createMockResponse();
    await route(createMockRequest(), capture.response, {} as never, "typed-error-test-2");
    expect(capture.getStatus()).toBe(400);
    expect(JSON.parse(capture.getBody() ?? "{}")).toEqual({ error: { code: "bad_request", message: "limit must be an integer between 1 and 1000" } });
  });

  it("rejects an over-budget serialized response before committing success headers", async () => {
    const route = createJsonRoute(
      async () => ({ value: "x".repeat(MAX_JSON_RESPONSE_BYTES) }),
      z.object({ value: z.string() })
    );
    const capture = createMockResponse();

    await route(createMockRequest(), capture.response, {} as never, "response-budget-test");

    expect(capture.getStatus()).toBe(502);
    expect(capture.getHeaders()).not.toHaveProperty("etag");
    expect(capture.getHeaders()).toMatchObject({ "cache-control": "no-store" });
    expect(JSON.parse(capture.getBody() ?? "{}")).toEqual({
      error: {
        code: "response_too_large",
        message: "The upstream response was too large. Please try again later."
      }
    });
  });

  it("does not attach data-derived success headers to an over-budget response", async () => {
    const route = createJsonRoute(
      async () => ({ value: "x".repeat(MAX_JSON_RESPONSE_BYTES) }),
      z.object({ value: z.string() }),
      { getExtraHeaders: () => ({ "x-data-mode": "live" }) }
    );
    const capture = createMockResponse();

    await route(createMockRequest(), capture.response, {} as never, "response-header-budget-test");

    expect(capture.getStatus()).toBe(502);
    expect(capture.getHeaders()).not.toHaveProperty("x-data-mode");
  });
});
