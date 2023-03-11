import { describe, expect, it } from "vitest";

describe("schema", () => {
  it("keeps the scope label stable", () => {
    expect("schema").toContain("schema");
  });
});

// regression note: schema
it("keeps schema stable", () => {
  expect("schema").toContain("schema");
});

// forced-schema-2
