/** Verifies transport and API failures retain their stable UI presentation contract. */
import { describe, expect, it } from "vitest";
import { ApiErrorException } from "../errors";
import { toUiError } from "../uiError";
import { HttpError } from "../../utils/fetchHelpers";

function httpError(code: string, status: number, retryAfterInSeconds?: number): HttpError {
  return new HttpError({
    message: "Upstream failure",
    code,
    status,
    retryAfterInSeconds,
  });
}

describe("toUiError", () => {
  it.each([
    ["institution mismatch", "institution_mismatch", 404, { kind: "institutionMismatch", messageKey: "errorInstitutionMismatch" }],
    ["validation failure", "validation_error", 503, { kind: "invalidResponse", messageKey: "errorInvalidResponse" }],
    ["timeout", "timeout", 429, { kind: "timeout", messageKey: "errorTimeout" }],
    ["unavailable source", "not_found", 404, { kind: "unavailableSource", messageKey: "errorUnavailable" }],
    ["missing institution", "institution_not_found", 503, { kind: "notFound", messageKey: "errorNotFound" }],
  ] as const)("prefers the %s BFF code over its HTTP status", (_label, code, status, expected) => {
    expect(toUiError(httpError(code, status, 15))).toEqual(expected);
  });

  it("retains Retry-After guidance for a rate limit identified by the BFF code", () => {
    expect(toUiError(httpError("rate_limited", 503, 45))).toEqual({
      kind: "rateLimit",
      messageKey: "errorRateLimit",
      retryAfterInSeconds: 45,
    });
  });

  it("retains Retry-After guidance for a rate limit identified by the HTTP status", () => {
    expect(toUiError(httpError("unknown_error", 429, 30))).toEqual({
      kind: "rateLimit",
      messageKey: "errorRateLimit",
      retryAfterInSeconds: 30,
    });
  });

  it("falls back to the server presentation for an unrecognized 5xx response", () => {
    expect(toUiError(httpError("unknown_error", 503, 60))).toEqual({
      kind: "server",
      messageKey: "errorServer",
    });
  });

  it("uses the representative 404 status fallback when no BFF code is known", () => {
    expect(toUiError(httpError("unknown_error", 404))).toEqual({
      kind: "notFound",
      messageKey: "errorNotFound",
    });
  });

  it("maps API exceptions using the same code-first presentation", () => {
    const error = new ApiErrorException({
      message: "Configured institution differs",
      code: "institution_mismatch",
      status: 500,
    });

    expect(toUiError(error)).toEqual({
      kind: "institutionMismatch",
      messageKey: "errorInstitutionMismatch",
    });
  });

  it.each([
    ["a generic Error", new Error("Unexpected failure")],
    ["an unrecognized HTTP response", httpError("unknown_error", 400)],
    ["a non-error value", { reason: "Unexpected failure" }],
  ])("uses the generic unknown presentation for %s", (_label, error) => {
    expect(toUiError(error)).toEqual({
      kind: "unknown",
      messageKey: "errorUnknown",
    });
  });
});
