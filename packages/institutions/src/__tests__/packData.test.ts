/** Audits every bundled institution pack for schema validity and referential integrity. */
import { describe, expect, it } from "vitest";
import { InstitutionPackSchema } from "@concourse/shared";
import { getInstitutionPack } from "../packs";
import { examplePublicPack } from "../packs/example.public";
import { hfmtPublicPack } from "../packs/hfmt.public";
import { mockuniPublicPack } from "../packs/mockuni.public";

const allPacks = [
  { id: "example", raw: examplePublicPack },
  { id: "hfmt", raw: hfmtPublicPack },
  { id: "mockuni", raw: mockuniPublicPack },
] as const;

describe("Institution pack data validation", () => {
  describe("required fields", () => {
    it.each(allPacks)("pack '$id' has required fields: id, name, type, campuses", ({ raw }) => {
      expect(raw).toHaveProperty("id");
      expect(raw).toHaveProperty("name");
      expect(raw).toHaveProperty("type");
      expect(raw).toHaveProperty("campuses");
      expect(typeof raw.id).toBe("string");
      expect(typeof raw.name).toBe("string");
      expect(typeof raw.type).toBe("string");
      expect(Array.isArray(raw.campuses)).toBe(true);
      expect(raw.campuses.length).toBeGreaterThan(0);
    });
  });

  describe("URL validation", () => {
    it.each(allPacks)("pack '$id' uses HTTPS for all source URLs", ({ raw }) => {
      const eventSources = raw.publicSources?.events ?? [];
      const scheduleSources = raw.publicSources?.schedules ?? [];
      const allSources = [...eventSources, ...scheduleSources];

      for (const source of allSources) {
        expect(source.url).toMatch(/^https:\/\//);
      }
    });
  });

  describe("unique IDs", () => {
    it("all institution packs have unique IDs", () => {
      const ids = allPacks.map((p) => p.raw.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it.each(allPacks)("pack '$id' has unique room IDs within the pack", ({ raw }) => {
      const rooms = raw.publicRooms ?? [];
      const roomIds = rooms.map((r) => r.id);
      const uniqueRoomIds = new Set(roomIds);
      expect(uniqueRoomIds.size).toBe(roomIds.length);
    });

    it.each(allPacks)("pack '$id' has unique campus IDs within the pack", ({ raw }) => {
      const campusIds = raw.campuses.map((c) => c.id);
      const uniqueCampusIds = new Set(campusIds);
      expect(uniqueCampusIds.size).toBe(campusIds.length);
    });
  });

  describe("schema validation", () => {
    it.each(allPacks)("pack '$id' passes Zod InstitutionPackSchema validation", ({ id }) => {
      const pack = getInstitutionPack(id);
      expect(() => InstitutionPackSchema.parse(pack)).not.toThrow();
    });
  });

  describe("referential integrity", () => {
    it.each(allPacks)("pack '$id' room campusIds reference existing campuses", ({ raw }) => {
      const campusIds = new Set(raw.campuses.map((c) => c.id));
      const rooms = raw.publicRooms ?? [];

      for (const room of rooms) {
        expect(campusIds.has(room.campusId)).toBe(true);
      }
    });
  });

  describe("HfMT public schedule configuration", () => {
    it("does not advertise a schedule source until a live public calendar is configured", () => {
      expect(hfmtPublicPack.publicSources.schedules).toEqual([]);
    });
  });

  describe("load without throwing", () => {
    it.each(allPacks)("pack '$id' loads via getInstitutionPack without throwing", ({ id }) => {
      expect(() => getInstitutionPack(id)).not.toThrow();
    });
  });

  describe("campus data completeness", () => {
    it.each(allPacks)("pack '$id' campuses have required fields", ({ raw }) => {
      for (const campus of raw.campuses) {
        expect(campus).toHaveProperty("id");
        expect(campus).toHaveProperty("name");
        expect(campus).toHaveProperty("city");
        expect(campus).toHaveProperty("address");
        expect(campus).toHaveProperty("labels");
        expect(typeof campus.id).toBe("string");
        expect(typeof campus.name).toBe("string");
        expect(typeof campus.city).toBe("string");
        expect(typeof campus.address).toBe("string");
        expect(Array.isArray(campus.labels)).toBe(true);
      }
    });
  });
});
