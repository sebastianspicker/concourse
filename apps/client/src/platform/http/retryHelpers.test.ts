import { describe, expect, it } from "vitest";
import { getRetryDelayMs } from "./retryHelpers";

describe("getRetryDelayMs", () => {
  it("clamps server-provided delays to the configured ceiling", () => {
    expect(getRetryDelayMs(
      { status: 429, retryAfterInSeconds: 86_400 },
      250,
      1,
      2,
      30_000
    )).toBe(30_000);
  });

  it("retains a server delay below the configured ceiling", () => {
    expect(getRetryDelayMs(
      { status: 503, retryAfterInSeconds: 5 },
      250,
      1,
      2,
      30_000
    )).toBe(5_000);
  });
});
