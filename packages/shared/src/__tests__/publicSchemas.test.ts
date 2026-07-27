/** Verifies the shared schemas reject unsafe configuration while accepting minimal public data. */
import { describe, expect, it } from "vitest";
import {
  EventsResponseSchema,
  INSTITUTION_DESIGN_CANVASES,
  InstitutionDesignPresetSchema,
  InstitutionPackSchema,
  ScheduleResponseSchema,
  TodayResponseSchema
} from "../domain/public";

describe("@concourse/shared schemas", () => {
  it("parses minimal institution pack", () => {
    expect(() =>
      InstitutionPackSchema.parse({
        id: "hfmt",
        name: "Example University",
        type: "music-and-dance",
        campuses: [],
        publicSources: {
          events: [],
          schedules: []
        }
      })
    ).not.toThrow();
  });

  it("rejects invalid institution pack timezones", () => {
    expect(() =>
      InstitutionPackSchema.parse({
        id: "hfmt",
        name: "Example University",
        type: "music-and-dance",
        campuses: [],
        timezone: "not-a-timezone"
      })
    ).toThrow();
  });

  it("accepts the supported institution design presets", () => {
    expect(InstitutionDesignPresetSchema.options).toEqual(["wayfinding", "atelier", "precision"]);
    for (const designPreset of InstitutionDesignPresetSchema.options) {
      expect(() => InstitutionDesignPresetSchema.parse(designPreset)).not.toThrow();
    }
  });

  it("defines a light and dark validation canvas for every design preset", () => {
    expect(Object.keys(INSTITUTION_DESIGN_CANVASES).sort()).toEqual([...InstitutionDesignPresetSchema.options].sort());
    for (const canvases of Object.values(INSTITUTION_DESIGN_CANVASES)) {
      expect(canvases.light).toMatch(/^#[0-9A-F]{6}$/i);
      expect(canvases.dark).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it("rejects unknown institution design presets", () => {
    expect(() => InstitutionDesignPresetSchema.parse("unknown")).toThrow();
  });

  it("parses empty responses", () => {
    expect(() => EventsResponseSchema.parse({ events: [] })).not.toThrow();
    expect(() => ScheduleResponseSchema.parse({ schedule: [] })).not.toThrow();
    expect(() =>
      TodayResponseSchema.parse({ events: [], rooms: [] })
    ).not.toThrow();
  });
});
