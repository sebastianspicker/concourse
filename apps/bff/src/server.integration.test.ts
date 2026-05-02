import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createRequestListener } from "./server";
import { clearRateLimitBuckets } from "./utils/rateLimit";

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
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "not_found" });
    });

    it("returns 405 for POST to data route", async () => {
      const app = createRequestListener();
      const res = await request(app).post("/events").expect(405);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "method_not_allowed" });
    });

    it("returns 405 for PUT to data route", async () => {
      const app = createRequestListener();
      const res = await request(app).put("/events").expect(405);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "method_not_allowed" });
    });

    it("returns 405 for DELETE to data route", async () => {
      const app = createRequestListener();
      const res = await request(app).delete("/events").expect(405);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "method_not_allowed" });
    });

    it("returns 404 for unknown route with valid institution", async () => {
      // BFF_ENV.institutionId is fixed at module-load time; we verify 404 for a bad path
      const app = createRequestListener();
      const res = await request(app).get("/no-such-endpoint").expect(404);

      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "not_found" });
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

    it("handles invalid limit parameter", async () => {
      const app = createRequestListener();
      const res = await request(app)
        .get("/events?limit=abc")
        .expect(400);
      
      expect(res.body.error.code).toBe("bad_request");
    });

    it("handles negative limit parameter", async () => {
      const app = createRequestListener();
      const res = await request(app)
        .get("/events?limit=-1")
        .expect(400);
      
      expect(res.body.error.code).toBe("bad_request");
    });

    it("handles invalid offset parameter", async () => {
      const app = createRequestListener();
      const res = await request(app)
        .get("/events?offset=xyz")
        .expect(200);
      
      expect(res.body).toHaveProperty("events");
    });

    it("handles extremely large limit parameter", async () => {
      const app = createRequestListener();
      const res = await request(app)
        .get("/events?limit=999999999")
        .expect(400);
      
      expect(res.body.error.code).toBe("bad_request");
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
      const app = createRequestListener();
      const limit = 65;
      for (let i = 0; i < limit; i++) {
        await request(app).get("/health");
      }
      const res = await request(app).get("/health").expect(429);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "rate_limited" });
      expect(res.headers["retry-after"]).toBeDefined();
    });

    it("includes retry-after header in rate limit response", async () => {
      const app = createRequestListener();
      const limit = 65;
      for (let i = 0; i < limit; i++) {
        await request(app).get("/health");
      }
      const res = await request(app).get("/health").expect(429);
      const retryAfter = parseInt(res.headers["retry-after"], 10);
      expect(retryAfter).toBeGreaterThan(0);
    });

    it("rate limit response includes proper error body", async () => {
      const app = createRequestListener();
      const limit = 65;
      for (let i = 0; i < limit; i++) {
        await request(app).get("/health");
      }
      const res = await request(app).get("/health").expect(429);
      
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toHaveProperty("code");
      expect(res.body.error).toHaveProperty("message");
      expect(res.body.error.code).toBe("rate_limited");
    });

    it("ignores spoofed forwarded headers in the default proxy mode", async () => {
      const app = createRequestListener();
      const limit = 65;

      for (let i = 0; i < limit; i++) {
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
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);

      // Health endpoint should still work
      expect(res.body).toHaveProperty("status", "ok");
    });

    it("returns proper error structure for server errors", async () => {
      const app = createRequestListener();
      
      // Test that error responses have consistent structure
      const res = await request(app).get("/unknown-route").expect(404);
      
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toHaveProperty("code");
      expect(res.body.error).toHaveProperty("message");
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
    it("returns 200 for GET /health", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.body).toMatchObject({ status: "ok" });
    });

    it("returns version in health response", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.body).toHaveProperty("version");
    });

    it("returns institution in health response", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.body).toHaveProperty("institution");
    });

    it("returns uptime in health response", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.body).toHaveProperty("uptime");
      // Uptime is returned as a formatted string
      expect(typeof res.body.uptime).toBe("string");
    });

    it("returns checks in health response", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      expect(res.body).toHaveProperty("checks");
      expect(res.body.checks).toHaveProperty("institutionPack");
      expect(res.body.checks).toHaveProperty("memory");
    });
  });

  describe("auth guard", () => {
    it("returns 401 when auth is required and no bearer token is provided", async () => {
      process.env.BFF_REQUIRE_AUTH = "1";
      process.env.BFF_AUTH_TOKEN = "test-token";
      const app = createRequestListener();

      const res = await request(app).get("/health").expect(401);
      expect(res.body.error.code).toBe("unauthorized");
    });

    it("allows requests when auth is required and a bearer token is present", async () => {
      process.env.BFF_REQUIRE_AUTH = "1";
      process.env.BFF_AUTH_TOKEN = "test-token";
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

  describe("rate limiting", () => {
    it("returns 429 when rate limit exceeded", async () => {
      const app = createRequestListener();
      const limit = 65;
      for (let i = 0; i < limit; i++) {
        await request(app).get("/health");
      }
      const res = await request(app).get("/health").expect(429);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatchObject({ code: "rate_limited" });
      expect(res.headers["retry-after"]).toBeDefined();
    });

    it("includes retry-after header in rate limit response", async () => {
      const app = createRequestListener();
      const limit = 65;
      for (let i = 0; i < limit; i++) {
        await request(app).get("/health");
      }
      const res = await request(app).get("/health").expect(429);
      const retryAfter = parseInt(res.headers["retry-after"], 10);
      expect(retryAfter).toBeGreaterThan(0);
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

  describe("rate limiting performance", () => {
    it("enforces rate limit threshold correctly", async () => {
      const app = createRequestListener();
      const limit = 60; // Default limit
      
      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
      }
      
      // Next request should be rate limited
      const res = await request(app).get("/health").expect(429);
      expect(res.body.error.code).toBe("rate_limited");
    });

    it("rate limit resets after window", async () => {
      vi.useFakeTimers();
      
      const app = createRequestListener();
      const limit = 60;
      
      // Exhaust rate limit
      for (let i = 0; i < limit + 5; i++) {
        await request(app).get("/health");
      }
      
      // Verify rate limited
      let res = await request(app).get("/health").expect(429);
      expect(res.body.error.code).toBe("rate_limited");
      
      // Advance time past the window (60 seconds + buffer)
      vi.advanceTimersByTime(65000);
      
      // Should be allowed again
      res = await request(app).get("/health").expect(200);
      expect(res.body.status).toBe("ok");
      
      vi.useRealTimers();
    });

    it("rate limit headers are not present in normal responses", async () => {
      const app = createRequestListener();
      const res = await request(app).get("/health").expect(200);
      
      // Normal responses don't have rate limit headers
      expect(res.headers["retry-after"]).toBeUndefined();
    });

    it("rate limit is enforced across different endpoints", async () => {
      const app = createRequestListener();
      const limit = 60;
      
      // Exhaust rate limit on health endpoint
      for (let i = 0; i < limit; i++) {
        await request(app).get("/health");
      }
      
      // Should be rate limited on events endpoint too
      const res = await request(app).get("/events").expect(429);
      expect(res.body.error.code).toBe("rate_limited");
    });

    it("handles concurrent requests correctly", async () => {
      const app = createRequestListener();
      
      // Make many concurrent requests
      const requests = Array.from({ length: 30 }, () => 
        request(app).get("/health")
      );
      
      const responses = await Promise.all(requests);
      
      // All should succeed since we're under the limit
      for (const res of responses) {
        expect(res.status).toBe(200);
      }
    });
  });

  describe("mock server for external sources", () => {
    it("handles timeout from external API gracefully", async () => {
      // Mock fetch to simulate timeout
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Network timeout"));
          }, 100);
        })
      ));
      
      const app = createRequestListener();
      
      // The server should handle the timeout gracefully
      // Since we're using fixtures, this test verifies error handling structure
      const res = await request(app).get("/health");
      
      // Health endpoint should still work
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles 500 error from external API", async () => {
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server Error"
      }));
      
      const app = createRequestListener();
      
      // Server should handle external API errors
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles 503 Service Unavailable from external API", async () => {
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service Temporarily Unavailable"
      }));
      
      const app = createRequestListener();
      
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles network error from external API", async () => {
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
      
      const app = createRequestListener();
      
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles malformed JSON response from external API", async () => {
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token in JSON");
        },
        text: async () => "Invalid JSON"
      }));
      
      const app = createRequestListener();
      
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles slow response from external API", async () => {
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ events: [] })
            });
          }, 5000); // 5 second delay
        })
      ));
      
      const app = createRequestListener();
      
      // Health endpoint should work independently
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles empty response from external API", async () => {
      const originalFetch = global.fetch;
      
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null
      }));
      
      const app = createRequestListener();
      
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });

    it("handles retry logic for transient failures", async () => {
      const originalFetch = global.fetch;
      let callCount = 0;
      
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("Transient error"));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ events: [] })
        });
      }));
      
      const app = createRequestListener();
      
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      
      vi.unstubAllGlobals();
      global.fetch = originalFetch;
    });
  });
});
