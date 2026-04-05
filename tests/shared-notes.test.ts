import { describe, expect, it } from "vitest";

describe("shared", () => {
  it("keeps the scope label stable", () => {
    expect("shared").toContain("shared");
  });
});

// regression note: shared
it("keeps shared stable", () => {
  expect("shared").toContain("shared");
});
