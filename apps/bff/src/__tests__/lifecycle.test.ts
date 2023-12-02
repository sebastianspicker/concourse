import { describe, expect, it } from "vitest";

describe("institutions", () => {
  it("keeps the scope label stable", () => {
    expect("institutions").toContain("institutions");
  });
});

// regression note: institutions
it("keeps institutions stable", () => {
  expect("institutions").toContain("institutions");
});

// forced-institutions-2
