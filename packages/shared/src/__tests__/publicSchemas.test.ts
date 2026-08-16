/** Verifies the shared schemas reject unsafe configuration while accepting minimal public data. */
import { describe, expect, it } from "vitest";
import {
  EventsResponseSchema,
  INSTITUTION_DESIGN_CANVASES,
  InstitutionDesignPresetSchema,
  InstitutionPackSchema,
  isPublicHttpUrl,
  PublicEventSchema,
  RoomsResponseSchema,
  ScheduleResponseSchema,
  TodayResponseSchema
} from "../domain/public";

const RESPONSE_SCHEMA_CASES = [
  {
    name: "events",
    schema: EventsResponseSchema,
    payload: { events: [] },
    expectedMetadata: { _total: 2, _degraded: true, _sourcesConfigured: false },
  },
  {
    name: "rooms",
    schema: RoomsResponseSchema,
    payload: { rooms: [] },
    expectedMetadata: { _total: 2, _sourcesConfigured: false },
  },
  {
    name: "today",
    schema: TodayResponseSchema,
    payload: { events: [], rooms: [] },
    expectedMetadata: { _degraded: true, _sourcesConfigured: false },
  },
  {
    name: "schedule",
    schema: ScheduleResponseSchema,
    payload: { schedule: [] },
    expectedMetadata: { _total: 2, _degraded: true, _sourcesConfigured: false },
  },
] as const;

const METADATA_INPUT = {
  _total: 2,
  _degraded: true,
  _sourcesConfigured: false,
  ignored: "value",
} as const;

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

  it.each(RESPONSE_SCHEMA_CASES)("accepts $name responses without optional metadata", ({ schema, payload }) => {
    expect(schema.parse(payload)).toEqual(payload);
  });

  it.each(RESPONSE_SCHEMA_CASES)("keeps the exact public metadata boundary for $name", ({ expectedMetadata, payload, schema }) => {
    expect(schema.parse({ ...payload, ...METADATA_INPUT })).toEqual({ ...payload, ...expectedMetadata });
  });

  it.each(RESPONSE_SCHEMA_CASES)("rejects an invalid configured-source status for $name", ({ payload, schema }) => {
    expect(() => schema.parse({ ...payload, _sourcesConfigured: "true" })).toThrow();
  });

  it.each(RESPONSE_SCHEMA_CASES.filter(({ expectedMetadata }) => "_degraded" in expectedMetadata))(
    "rejects an invalid degraded status for $name",
    ({ payload, schema }) => {
      expect(() => schema.parse({ ...payload, _degraded: "true" })).toThrow();
    },
  );

  it.each(RESPONSE_SCHEMA_CASES.filter(({ expectedMetadata }) => "_total" in expectedMetadata))(
    "rejects a non-integer total for $name",
    ({ payload, schema }) => {
      expect(() => schema.parse({ ...payload, _total: 1.5 })).toThrow();
    },
  );

  it("accepts HTTP(S) public event source URLs", () => {
    for (const sourceUrl of ["http://example.org/events/1", "https://example.org/events/1"]) {
      expect(() => PublicEventSchema.parse({
        id: "event-1",
        title: "Campus concert",
        date: "2026-07-14T18:00:00.000Z",
        sourceUrl
      })).not.toThrow();
    }
  });

  it.each([
    ["http://example.org/events/1", true],
    ["https://example.org/events/1", true],
    ["http://", false],
    ["https://?missing-host", false],
    ["javascript:alert(1)", false],
  ])("classifies public HTTP(S) URL %s as %s", (sourceUrl, expected) => {
    expect(isPublicHttpUrl(sourceUrl)).toBe(expected);
  });

  it.each(["javascript:alert(1)", "data:text/html,unsafe", "mailto:events@example.org", "ftp://example.org/events/1"])(
    "rejects non-web public event source URL %s",
    (sourceUrl) => {
      expect(() => PublicEventSchema.parse({
        id: "event-1",
        title: "Campus concert",
        date: "2026-07-14T18:00:00.000Z",
        sourceUrl
      })).toThrow();
    }
  );
});
