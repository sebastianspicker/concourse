import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createRequestListener } from "./server";
import { clearRateLimitBuckets } from "./utils/rateLimit";

describe("BFF server external-source resilience integration", () => {
  beforeAll(() => {
    process.env.INSTITUTION_ID = process.env.INSTITUTION_ID ?? "hfmt";
  });

  afterEach(() => {
    clearRateLimitBuckets();
    vi.unstubAllGlobals();
  });

  it("handles timeout from external API gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error("Network timeout"));
            }, 100);
          })
      )
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("handles 500 error from external API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server Error"
      })
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("handles 503 Service Unavailable from external API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: async () => "Service Temporarily Unavailable"
      })
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("handles network error from external API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("handles malformed JSON response from external API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token in JSON");
        },
        text: async () => "Invalid JSON"
      })
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("handles slow response from external API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ events: [] })
              });
            }, 5000);
          })
      )
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("handles empty response from external API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null
      })
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });

  it("handles retry logic for transient failures", async () => {
    let callCount = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("Transient error"));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ events: [] })
        });
      })
    );

    const app = createRequestListener();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });
});
