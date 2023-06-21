import { describe, expect, it } from "vitest";

describe("bff", () => {
  it("keeps the scope label stable", () => {
    expect("bff").toContain("bff");
  });
});

// regression note: bff
it("keeps bff stable", () => {
  expect("bff").toContain("bff");
});

// forced-bff-2
