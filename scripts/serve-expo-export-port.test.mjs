/** Verifies strict port parsing at both valid boundaries and malformed-input cases. */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePort } from "./serve-expo-export-port.mjs";

describe("parsePort", () => {
  it("accepts the default, bounds, and surrounding whitespace", () => {
    assert.equal(parsePort(undefined), 8081);
    assert.equal(parsePort("1"), 1);
    assert.equal(parsePort(" 65535 "), 65_535);
  });

  it("rejects partial, exponent, empty, and out-of-range values", () => {
    for (const value of ["8081junk", "1e3", "", "0", "65536", "-1", "1.5"]) {
      assert.throws(() => parsePort(value), /PORT must be an integer between 1 and 65535/);
    }
  });
});
