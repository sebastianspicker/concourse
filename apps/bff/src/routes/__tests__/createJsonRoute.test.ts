/** Verifies shared JSON route success and failure response handling. */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import institution from "../../__fixtures__/institution.public.json";
import { createMockReqRes } from "../../__tests__/httpMocks";
import { TimeoutError } from "../../utils/fetch";
import { createJsonRoute } from "../createJsonRoute";

describe("createJsonRoute", () => {
  it("uses the ingress request ID on route errors", async () => {
    const handler = createJsonRoute(async () => {
      throw new Error("connector failed");
    }, z.object({}));
    const { capture, request, response } = createMockReqRes();

    await handler(request, response, institution, "ingress-request-id");

    expect(capture.getStatus()).toBe(500);
    expect(capture.getHeaders()["x-request-id"]).toBe("ingress-request-id");
  });

  it("maps connector TimeoutError failures to the timeout response", async () => {
    const handler = createJsonRoute(async () => {
      throw new TimeoutError("https://public.example", 1000);
    }, z.object({}));
    const { capture, request, response } = createMockReqRes();

    await handler(request, response, institution, "timeout-request-id");

    expect(capture.getStatus()).toBe(504);
  });
});
