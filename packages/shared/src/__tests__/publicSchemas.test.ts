import { describe, expect, it } from "vitest";
import {
  EventsResponseSchema,
  InstitutionPackSchema,
  ScheduleResponseSchema,
  TodayResponseSchema
} from "../domain/public";

describe("@campus/shared schemas", () => {
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

  it("parses empty responses", () => {
    expect(() => EventsResponseSchema.parse({ events: [] })).not.toThrow();
    expect(() => ScheduleResponseSchema.parse({ schedule: [] })).not.toThrow();
    expect(() =>
      TodayResponseSchema.parse({ events: [], rooms: [] })
    ).not.toThrow();
  });
});

