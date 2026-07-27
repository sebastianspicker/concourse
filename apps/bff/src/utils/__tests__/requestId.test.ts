/** Verifies request-ID validation, fallback generation, and response propagation. */

import { describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { getRequestId, setRequestIdHeader } from "../requestId";

describe("getRequestId", () => {
  it("returns the x-request-id header when valid", () => {
    const req = { headers: { "x-request-id": "req-12345678" } } as unknown as IncomingMessage;
    expect(getRequestId(req)).toBe("req-12345678");
  });

  it("generates a UUID when no x-request-id header", () => {
    const req = { headers: {} } as unknown as IncomingMessage;
    const id = getRequestId(req);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("rejects request IDs shorter than 8 characters", () => {
    const req = { headers: { "x-request-id": "short" } } as unknown as IncomingMessage;
    const id = getRequestId(req);
    expect(id).not.toBe("short");
    expect(id).toMatch(/^[0-9a-f]{8}-/); // Generated UUID
  });

  it("rejects request IDs longer than 128 characters", () => {
    const req = { headers: { "x-request-id": "a".repeat(129) } } as unknown as IncomingMessage;
    const id = getRequestId(req);
    expect(id).toMatch(/^[0-9a-f]{8}-/);
  });

  it("rejects request IDs with special characters", () => {
    const req = { headers: { "x-request-id": "req-1234<script>" } } as unknown as IncomingMessage;
    const id = getRequestId(req);
    expect(id).toMatch(/^[0-9a-f]{8}-/);
  });

  it("accepts request IDs with dots, colons, and hyphens", () => {
    const req = { headers: { "x-request-id": "srv-01:req.abc-1234" } } as unknown as IncomingMessage;
    expect(getRequestId(req)).toBe("srv-01:req.abc-1234");
  });
});

describe("setRequestIdHeader", () => {
  it("does not mutate a response after its headers were sent", () => {
    const setHeader = vi.fn();
    setRequestIdHeader({ headersSent: true, setHeader } as unknown as ServerResponse, "req-12345678");
    expect(setHeader).not.toHaveBeenCalled();
  });
});
