/** Verifies the BFF only accepts supported HTTP methods. */

import { describe, expect, it } from "vitest";
import { createMockReqRes } from "../../__tests__/httpMocks";
import { guardMethods } from "../methodGuard";

function createMethodMocks(method: string) {
  const { capture, request, response } = createMockReqRes({ method });
  return { req: request, res: response, result: capture };
}

describe("guardMethods", () => {
  it("allows GET requests", () => {
    const { req, res } = createMethodMocks("GET");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(true);
  });

  it("allows OPTIONS requests", () => {
    const { req, res } = createMethodMocks("OPTIONS");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(true);
  });

  it("rejects POST requests", () => {
    const { req, res } = createMethodMocks("POST");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(false);
  });

  it("rejects DELETE requests", () => {
    const { req, res } = createMethodMocks("DELETE");
    expect(guardMethods(req, res, ["GET", "OPTIONS"])).toBe(false);
  });

  it("sets Allow header on rejection", () => {
    const { req, res, result: capture } = createMethodMocks("PUT");
    guardMethods(req, res, ["GET", "OPTIONS"]);
    expect(capture.getHeaders().allow).toBe("GET, OPTIONS");
  });
});
