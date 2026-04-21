import { describe, expect, it } from "vitest";
import { parseIcs } from "../icsParser";

describe("parseIcs", () => {
  describe("basic parsing", () => {
    it("parses a simple event", () => {
      const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-1
SUMMARY:Test Event
DTSTART:20260101T100000Z
DTEND:20260101T110000Z
LOCATION:Room 101
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        id: "test-1",
        title: "Test Event",
        startsAt: "2026-01-01T10:00:00.000Z",
        endsAt: "2026-01-01T11:00:00.000Z",
        location: "Room 101",
        campusId: undefined
      });
    });

    it("parses all-day event", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:test-2
SUMMARY:All Day Event
DTSTART:20260101
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events).toHaveLength(1);
      expect(events[0].startsAt).toBe("2026-01-01T00:00:00.000Z");
    });

    it("handles missing UID by generating stable ID", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
SUMMARY:No UID Event
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events).toHaveLength(1);
      expect(events[0].id).toMatch(/^[a-f0-9]{16}$/);
    });

    it("unescapes special characters in summary and location", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:test-3
SUMMARY:Event with\\, comma and\\n newline
LOCATION:Room \\; 101
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events[0].title).toBe("Event with, comma and\n newline");
      expect(events[0].location).toBe("Room ; 101");
    });
  });

  describe("RRULE expansion", () => {
    it("expands daily recurring event", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:daily-recurring
SUMMARY:Daily Standup
DTSTART:20260201T090000Z
DTEND:20260201T093000Z
RRULE:FREQ=DAILY;COUNT=3
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      expect(events).toHaveLength(3);
      expect(events[0].startsAt).toBe("2026-02-01T09:00:00.000Z");
      expect(events[1].startsAt).toBe("2026-02-02T09:00:00.000Z");
      expect(events[2].startsAt).toBe("2026-02-03T09:00:00.000Z");
      
      // All should be marked as recurring
      expect(events.every(e => e.isRecurring)).toBe(true);
    });

    it("expands weekly recurring event with BYDAY", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:weekly-recurring
SUMMARY:Weekly Meeting
DTSTART:20260202T140000Z
DTEND:20260202T150000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=3
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      expect(events).toHaveLength(3);
      // Monday, Wednesday, Friday
      expect(new Date(events[0].startsAt).getUTCDay()).toBe(1); // Monday
      expect(new Date(events[1].startsAt).getUTCDay()).toBe(3); // Wednesday
      expect(new Date(events[2].startsAt).getUTCDay()).toBe(5); // Friday
    });

    it("expands monthly recurring event", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:monthly-recurring
SUMMARY:Monthly Review
DTSTART:20260115T100000Z
DTEND:20260115T110000Z
RRULE:FREQ=MONTHLY;COUNT=3
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 90 });
      
      expect(events).toHaveLength(3);
      expect(new Date(events[0].startsAt).getUTCMonth()).toBe(0); // January
      expect(new Date(events[1].startsAt).getUTCMonth()).toBe(1); // February
      expect(new Date(events[2].startsAt).getUTCMonth()).toBe(2); // March
    });

    it("respects UNTIL constraint", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:until-recurring
SUMMARY:Limited Series
DTSTART:20260201T100000Z
DTEND:20260201T110000Z
RRULE:FREQ=DAILY;UNTIL=20260205T100000Z
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      // Should have events from Feb 1-5 (5 days)
      expect(events.length).toBe(5);
    });

    it("respects INTERVAL parameter", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:interval-recurring
SUMMARY:Bi-weekly Meeting
DTSTART:20260203T100000Z
DTEND:20260203T110000Z
RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 60 });
      
      expect(events).toHaveLength(3);
      // Each event should be 2 weeks apart
      const diff1 = (new Date(events[1].startsAt).getTime() - new Date(events[0].startsAt).getTime()) / (1000 * 60 * 60 * 24);
      const diff2 = (new Date(events[2].startsAt).getTime() - new Date(events[1].startsAt).getTime()) / (1000 * 60 * 60 * 24);
      expect(diff1).toBe(14);
      expect(diff2).toBe(14);
    });

    it("limits expansion to horizon days", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:horizon-test
SUMMARY:Daily Forever
DTSTART:20260201T100000Z
RRULE:FREQ=DAILY
END:VEVENT
END:VCALENDAR
`;
      // With a 7-day horizon
      const events = parseIcs(ics, { rruleHorizonDays: 7 });
      
      // Should have events within 7 days from now
      expect(events.length).toBeLessThanOrEqual(8); // Including today
    });

    it("limits expansion to max instances", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:max-instances-test
SUMMARY:Daily Forever
DTSTART:20260201T100000Z
RRULE:FREQ=DAILY
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 365, rruleMaxInstances: 5 });
      
      expect(events.length).toBeLessThanOrEqual(5);
    });

    it("preserves duration across instances", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:duration-test
SUMMARY:2-Hour Meeting
DTSTART:20260201T100000Z
DTEND:20260201T120000Z
RRULE:FREQ=DAILY;COUNT=3
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      events.forEach(event => {
        const duration = new Date(event.endsAt!).getTime() - new Date(event.startsAt).getTime();
        expect(duration).toBe(2 * 60 * 60 * 1000); // 2 hours
      });
    });

    it("generates unique IDs for each instance", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:unique-id-test
SUMMARY:Recurring Event
DTSTART:20260201T100000Z
RRULE:FREQ=DAILY;COUNT=3
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      const ids = events.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(events.length);
    });

    it("handles invalid RRULE gracefully by returning base event", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:invalid-rrule
SUMMARY:Bad RRULE
DTSTART:20260201T100000Z
RRULE:INVALID_RULE
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      // Should return just the base event
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe("Bad RRULE");
    });

    it("handles non-recurring event without RRULE", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:non-recurring
SUMMARY:One-time Event
DTSTART:20260201T100000Z
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics, { rruleHorizonDays: 30 });
      
      expect(events).toHaveLength(1);
      expect(events[0].isRecurring).toBeUndefined();
    });
  });

  describe("campus ID extraction", () => {
    it("extracts campus ID from X-CAMPUS-ID", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:campus-test-1
SUMMARY:Event with Campus
DTSTART:20260101T100000Z
X-CAMPUS-ID:main-campus
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events[0].campusId).toBe("main-campus");
    });

    it("extracts campus ID from X-CAMPUS", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:campus-test-2
SUMMARY:Event with Campus
DTSTART:20260101T100000Z
X-CAMPUS:secondary-campus
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events[0].campusId).toBe("secondary-campus");
    });
  });

  describe("line unfolding", () => {
    it("handles folded lines", () => {
      const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:folded-test
SUMMARY:This is a very long title that
  continues on the next line
DTSTART:20260101T100000Z
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events[0].title).toBe("This is a very long title that continues on the next line");
    });
  });

  describe("sorting", () => {
    it("sorts events by start date", () => {
      const ics = `
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-3
SUMMARY:Event 3
DTSTART:20260103T100000Z
END:VEVENT
BEGIN:VEVENT
UID:event-1
SUMMARY:Event 1
DTSTART:20260101T100000Z
END:VEVENT
BEGIN:VEVENT
UID:event-2
SUMMARY:Event 2
DTSTART:20260102T100000Z
END:VEVENT
END:VCALENDAR
`;
      const events = parseIcs(ics);
      
      expect(events[0].title).toBe("Event 1");
      expect(events[1].title).toBe("Event 2");
      expect(events[2].title).toBe("Event 3");
    });
  });
});
