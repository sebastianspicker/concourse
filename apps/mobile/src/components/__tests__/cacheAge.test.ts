/** Verifies cached-data ages are formatted into localized, user-understandable intervals. */
import { describe, expect, it } from "vitest";
import { formatCacheAge } from "../cacheAge";

describe("formatCacheAge", () => {
  it("uses the active locale for relative cache age", () => {
    expect(formatCacheAge(2 * 60 * 60 * 1000, "en")).toContain("2 hours ago");
    expect(formatCacheAge(2 * 60 * 60 * 1000, "de")).toContain("2 Stunden");
  });
});
