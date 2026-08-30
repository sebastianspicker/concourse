/** Verifies localization remains in the design-system presentation layer. */
import { describe, expect, it } from "vitest";
import { getErrorMessageKey } from "../errorStatePresentation";

describe("error presentation", () => {
  it("maps semantic HTTP failures to localized message keys outside the platform layer", () => {
    expect(getErrorMessageKey({ kind: "offline" })).toBe("errorOffline");
    expect(getErrorMessageKey({ kind: "institutionMismatch" })).toBe("errorInstitutionMismatch");
    expect(getErrorMessageKey({ kind: "rateLimit", retryAfterInSeconds: 20 })).toBe("errorRateLimit");
  });
});
