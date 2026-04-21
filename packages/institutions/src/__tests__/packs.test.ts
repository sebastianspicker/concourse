import { describe, expect, it } from "vitest";
import { InstitutionPackSchema } from "@campus/shared";
import { getInstitutionPack } from "../packs";

describe("@campus/institutions", () => {
  it("returns a schema-valid pack for known institution ids", () => {
    const pack = getInstitutionPack("hfmt");
    expect(() => InstitutionPackSchema.parse(pack)).not.toThrow();
  });

  it("throws for unknown institution ids", () => {
    expect(() => getInstitutionPack("does-not-exist")).toThrow(/Unknown institutionId/);
  });
});

