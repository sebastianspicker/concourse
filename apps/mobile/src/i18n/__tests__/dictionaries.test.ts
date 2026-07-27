/** Verifies both locale dictionaries expose the same translation keys. */
import { describe, expect, it } from "vitest";
import { de, en } from "../dictionaries";

describe("locale dictionaries", () => {
  it("keep English and German keys in parity", () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
  });

  it("does not ship blank translations", () => {
    expect(Object.values(en).every((value) => value.trim().length > 0)).toBe(true);
    expect(Object.values(de).every((value) => value.trim().length > 0)).toBe(true);
  });
});
