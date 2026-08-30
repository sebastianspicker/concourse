import { PublicResponseHeader } from "@concourse/contracts";
import { describe, expect, it } from "vitest";
import { getCorsHeaders } from "./cors";

describe("CORS response contract", () => {
  it("exposes every response header consumed by browser clients", () => {
    const headers = getCorsHeaders("https://client.example.test", ["https://client.example.test"]);
    const exposed = new Set(headers["access-control-expose-headers"]?.split(", ").map((value) => value.toLowerCase()));

    expect(exposed).toEqual(new Set([
      PublicResponseHeader.institutionId,
      PublicResponseHeader.requestId,
      PublicResponseHeader.dataDegraded,
      PublicResponseHeader.dataMode,
      PublicResponseHeader.retryAfter,
    ]));
    expect(headers.vary).toBe("origin");
  });

  it("does not emit CORS headers for an unapproved origin", () => {
    expect(getCorsHeaders("https://attacker.example.test", ["https://client.example.test"])).toEqual({});
  });

  it("uses wildcard semantics without a misleading Vary header", () => {
    const headers = getCorsHeaders("https://any.example.test", ["*"]);
    expect(headers["access-control-allow-origin"]).toBe("*");
    expect(headers.vary).toBeUndefined();
  });
});
