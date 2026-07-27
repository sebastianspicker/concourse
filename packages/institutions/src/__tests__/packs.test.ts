/** Verifies pack lookup, preset coverage, and accessible institution identity defaults. */
import { describe, expect, it } from "vitest";
import { InstitutionPackSchema, isAccessibleInstitutionAccent } from "@concourse/shared";
import { getInstitutionPack } from "../packs";

describe("@concourse/institutions", () => {
  it("returns a schema-valid pack for known institution ids", () => {
    for (const institutionId of ["example", "hfmt", "mockuni"]) {
      const pack = getInstitutionPack(institutionId);
      expect(() => InstitutionPackSchema.parse(pack)).not.toThrow();
    }
  });

  it("throws for unknown institution ids", () => {
    expect(() => getInstitutionPack("does-not-exist")).toThrow(/Unknown institutionId/);
  });

  it("ships a working example for each design preset", () => {
    expect(getInstitutionPack("example").app?.designPreset).toBe("wayfinding");
    expect(getInstitutionPack("hfmt").app?.designPreset).toBe("atelier");
    expect(getInstitutionPack("mockuni").app?.designPreset).toBe("precision");
  });

  it("rejects institution accents that cannot identify controls accessibly", () => {
    expect(isAccessibleInstitutionAccent("#D7DEE3")).toBe(false);
    expect(isAccessibleInstitutionAccent("#176B87")).toBe(true);
  });
});
