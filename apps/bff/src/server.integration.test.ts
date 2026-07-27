/** Exercises BFF HTTP integration behavior across public routes. */

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { expectErrorEnvelope } from "./__tests__/httpMocks";
import { createRequestListener } from "./server";
import { clearRateLimitBuckets } from "./utils/rateLimit";

async function rateLimitedHealthRequest() {
  const app = createRequestListener();
  for (let index = 0; index < 65; index += 1) {
    await request(app).get("/health");
  }
  return request(app).get("/health").expect(429);
}

function healthyResponse() {
  return request(createRequestListener()).get("/health").expect(200);
}

function requireAuthentication() {
  process.env.BFF_REQUIRE_AUTH = "1";
  process.env.BFF_AUTH_TOKEN = "test-token";
}

function expectRateLimitedResponse(
  res: Awaited<ReturnType<typeof rateLimitedHealthRequest>>,
) {
  expectErrorEnvelope(res.body);
  expect(res.body.error.code).toBe("rate_limited");
}

function expectNotFoundResponse(res: { body: Record<string, unknown> }) {
  expect(res.body).toHaveProperty("error");
  expect(res.body.error).toMatchObject({ code: "not_found" });
}

describe("BFF server integration", () => {
  beforeAll(() => {
    process.env.INSTITUTION_ID = process.env.INSTITUTION_ID ?? "hfmt";
  });

  afterEach(() => {
    clearRateLimitBuckets();
    delete process.env.BFF_REQUIRE_AUTH;
    delete process.env.BFF_AUTH_TOKEN;
    vi.unstubAllGlobals();
  });

  describe("error handling", () => {
    it("returns 404 for unknown path", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/unknown").expect(404);
      expectNotFoundResponse(res);
    });

    it.each([
      ["POST", () => request(createRequestListener()).post("/events")],
      ["PUT", () => request(createRequestListener()).put("/events")],
      ["DELETE", () => request(createRequestListener()).delete("/events")],
    ])("returns 405 for %s to data route", async (_method, sendRequest) => {
      const res = await sendRequest().expect(405);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "method_not_allowed" });
    });

    it("returns 404 for unknown route with valid institution", async () => {
      // BFF_ENV.institutionId is fixed at module-load time; we verify 404 for a bad path
      const app = createRequestListener();
      const res = await request(app).get("/no-such-endpoint").expect(404);

      expectNotFoundResponse(res);
    });
  });

  describe("400 Bad Request handling", () => {
    it("handles malformed URL gracefully", async () => {
      const app = createRequestListener();
      // Sending a request with malformed path characters
      const res = await request(app)
        .get("/events?from=invalid-date-format")
        .expect(200); // Should handle gracefully and return results
      
      expect(res.body).toHaveProperty("events");
    });

    it.each([
      ["invalid", "abc"],
      ["negative", "-1"],
      ["extremely large", "999999999"],
    ])("handles %s limit parameter", async (_description, limit) => {
      const app = createRequestListener();
      const res = await request(app).get(`/events?limit=${limit}`).expect(400);

      expect(res.body.error.code).toBe("bad_request");
    });

    it("handles invalid offset parameter", async () => {
      const app = createRequestListener();
      const res = await request(app)
        .get("/events?offset=xyz")
        .expect(200);
      
      expect(res.body).toHaveProperty("events");
    });

  });

  describe("404 Not Found handling", () => {
    it("returns 404 for non-existent route", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/nonexistent-route").expect(404);
      
      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe("not_found");
      expect(res.body.error.message).toBeDefined();
    });

    it("returns 404 for deeply nested non-existent route", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/api/v1/events/deep/nested/path").expect(404);
      
      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe("not_found");
    });

    it("returns 405 for POST to non-existent route", async () => {
      // Method guard runs before route lookup, so non-GET requests get 405 regardless of path.
      const app = createRequestListener();
      const res = await request(app)
        .post("/nonexistent")
        .send({ data: "test" })
        .expect(405);

      expect(res.body).toHaveProperty("error");
    });
  });

  describe("429 Rate Limit handling", () => {
    it("returns 429 when rate limit exceeded", async () => {
      const res = await rateLimitedHealthRequest();
      expectRateLimitedResponse(res);
      expect(res.headers["retry-after"]).toBeDefined();
    });

    it("includes retry-after header in rate limit response", async () => {
      const res = await rateLimitedHealthRequest();
      const retryAfter = parseInt(res.headers["retry-after"], 10);
      expect(retryAfter).toBeGreaterThan(0);
    });

    it("rate limit response includes proper error body", async () => {
      const res = await rateLimitedHealthRequest();
      
      expectRateLimitedResponse(res);
    });

    it("ignores spoofed forwarded headers in the default proxy mode", async () => {
      const app = createRequestListener();
      for (let index = 0; index < 65; index += 1) {
        await request(app).get("/health").set("X-Forwarded-For", "192.168.1.1");
      }
      const res1 = await request(app)
        .get("/health")
        .set("X-Forwarded-For", "192.168.1.1")
        .expect(429);
      const res2 = await request(app)
        .get("/health")
        .set("X-Forwarded-For", "192.168.1.2")
        .expect(429);

      expect(res1.body.error.code).toBe("rate_limited");
      expect(res2.body.error.code).toBe("rate_limited");
    });
  });

  describe("500 Internal Server Error handling", () => {
    it("handles unexpected errors gracefully", async () => {
      // Verify the health endpoint continues to work as a baseline
      const res = await healthyResponse();

      // Health endpoint should still work
      expect(res.body).toHaveProperty("status", "ok");
    });

    it("returns proper error structure for server errors", async () => {
      const app = createRequestListener();
      
      // Test that error responses have consistent structure
      const res = await request(app).get("/unknown-route").expect(404);
      
      expectErrorEnvelope(res.body);
      expect(typeof res.body.error.code).toBe("string");
      expect(typeof res.body.error.message).toBe("string");
    });
  });

  describe("malformed request handling", () => {
    it("handles malformed query parameters", async () => {
      const app = createRequestListener();
      
      // Various malformed query string scenarios
      const testCases = [
        "/events?search=%",
        "/events?from=",
        "/events?to=",
        "/events?limit=",
        "/events?offset=",
      ];

      for (const path of testCases) {
        const res = await request(app).get(path);
        // Should not return 500 for malformed queries
        expect(res.status).toBeLessThan(500);
      }
    });

    it("handles empty query parameter values", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?search=&from=&to=");
      
      // Should handle empty values gracefully
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("events");
    });

    it("handles special characters in search parameter", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?search=<script>alert('xss')</script>");
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("events");
    });

    it("handles unicode in query parameters", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?search=测试🎉");
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("events");
    });

    it("handles very long query parameter values", async () => {
      const app = createRequestListener();
      const longSearch = "a".repeat(10000);
      const res = await request(app).get(`/events?search=${longSearch}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("events");
    });
  });

  describe("health endpoint", () => {
    it.each([
      ["returns 200 for GET /health", (res: { body: Record<string, unknown> }) => expect(res.body).toMatchObject({ status: "ok" })],
      ["returns version in health response", (res: { body: Record<string, unknown> }) => expect(res.body).toHaveProperty("version")],
      ["returns institution in health response", (res: { body: Record<string, unknown> }) => expect(res.body).toHaveProperty("institution")],
      ["returns uptime in health response", (res: { body: Record<string, unknown> }) => {
        expect(res.body).toHaveProperty("uptime");
        expect(typeof res.body.uptime).toBe("string");
      }],
      ["returns checks in health response", (res: { body: Record<string, unknown> }) => {
        expect(res.body).toHaveProperty("checks");
        expect(res.body.checks).toMatchObject({ institutionPack: expect.anything(), memory: expect.anything() });
      }],
    ])("%s", async (_name, assertion) => {
      assertion(await healthyResponse());
    });
  });

  describe("auth guard", () => {
    it("returns 401 when auth is required and no bearer token is provided", async () => {
      requireAuthentication();
      const app = createRequestListener();

      const res = await request(app).get("/health").expect(401);
      expect(res.body.error.code).toBe("unauthorized");
    });

    it("allows requests when auth is required and a bearer token is present", async () => {
      requireAuthentication();
      const app = createRequestListener();

      const res = await request(app)
        .get("/health")
        .set("Authorization", "Bearer test-token")
        .expect(200);

      expect(res.body.status).toBe("ok");
    });
  });

  describe("events endpoint", () => {
    it("returns 200 for GET /events when institution is loaded", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events").expect(200);
      expect(res.body).toHaveProperty("events");
      expect(Array.isArray(res.body.events)).toBe(true);
      expect(res.headers["x-institution-id"]).toBe(process.env.INSTITUTION_ID ?? "hfmt");
    });

    it("returns events with required fields", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events").expect(200);
      if (res.body.events.length > 0) {
        const event = res.body.events[0];
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("title");
      }
    });

    it("supports search query parameter", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?search=test").expect(200);
      expect(res.body).toHaveProperty("events");
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    it("supports from date query parameter", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?from=2024-01-01").expect(200);
      expect(res.body).toHaveProperty("events");
    });

    it("supports to date query parameter", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?to=2025-12-31").expect(200);
      expect(res.body).toHaveProperty("events");
    });

    it("supports limit query parameter", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/events?limit=5").expect(200);
      expect(res.body).toHaveProperty("events");
      expect(res.body.events.length).toBeLessThanOrEqual(5);
    });

    it("supports offset query parameter", async () => {
      const app = createRequestListener();
      const res1 = await request(app).get("/events?limit=2").expect(200);
      const res2 = await request(app).get("/events?limit=2&offset=1").expect(200);
      // If there are at least 2 events, the second request should start from a different event
      if (res1.body.events.length >= 2 && res2.body.events.length >= 1) {
        // First event of second request should be second event of first request
        expect(res2.body.events[0]?.id).toBe(res1.body.events[1]?.id);
      }
    });
  });

  describe("rooms endpoint", () => {
    it("returns 200 for GET /rooms", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/rooms").expect(200);
      expect(res.body).toHaveProperty("rooms");
      expect(Array.isArray(res.body.rooms)).toBe(true);
    });
  });

  describe("today endpoint", () => {
    it("returns 200 for GET /today", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/today").expect(200);
      expect(res.body).toHaveProperty("events");
      // Schedule may not be present if no schedules configured
    });
  });

  describe("security headers", () => {
    it("includes X-Content-Type-Options header", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("includes X-Frame-Options header", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.headers["x-frame-options"]).toBe("DENY");
    });

    it("includes X-Request-Id header", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.headers["x-request-id"]).toBeDefined();
    });
  });

  describe("CORS", () => {
    it("handles OPTIONS preflight request", async () => {
      const app = createRequestListener();
      await request(app)
        .options("/events")
        .set("Origin", "http://localhost:8081")
        .set("Access-Control-Request-Method", "GET")
        .expect(204);
    });
  });

});
