/** Supplies sanitized public-campus fixtures to the static GitHub Pages build. */
import type { EventsResponse, RoomsResponse, ScheduleResponse, TodayResponse } from "../api/types";

export const STATIC_DEMO_EVENT_IDS = ["welcome-concert", "library-tour", "student-services"] as const;
export const STATIC_DEMO_ROOM_IDS = ["auditorium", "library", "seminar-204"] as const;
export const STATIC_DEMO_SCHEDULE_IDS = ["orientation", "welcome-session", "open-rehearsal"] as const;
export const STATIC_DEMO_DATE = "2026-09-14";

const rooms: RoomsResponse["rooms"] = [
  { id: "auditorium", name: "Auditorium", campusId: "main" },
  { id: "library", name: "Library", campusId: "main" },
  { id: "seminar-204", name: "Seminar room 204", campusId: "main" },
];

/** Produces a stable ISO instant on or after the requested campus date. */
function datedInstant(date: string, dayOffset: number, time: string): string {
  const instant = new Date(`${date}T${time}:00.000Z`);
  instant.setUTCDate(instant.getUTCDate() + dayOffset);
  return instant.toISOString();
}

/** Selects a valid YYYY-MM-DD query date or the deterministic fixture date. */
function queryDate(query: Record<string, string> | undefined, key: string): string {
  const value = query?.[key];
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : STATIC_DEMO_DATE;
}

function demoEvents(date: string): EventsResponse["events"] {
  return [
    { id: "welcome-concert", title: "Welcome concert", date: datedInstant(date, 0, "17:30"), sourceUrl: "https://example.org/events/welcome-concert" },
    { id: "library-tour", title: "Library introduction", date: datedInstant(date, 1, "09:00"), sourceUrl: "https://example.org/events/library-tour" },
    { id: "student-services", title: "Student services open hour", date: datedInstant(date, 2, "12:00"), sourceUrl: "https://example.org/events/student-services" },
  ];
}

function demoSchedule(date: string): ScheduleResponse["schedule"] {
  return [
    { id: "orientation", title: "Campus orientation", startsAt: datedInstant(date, 0, "08:00"), endsAt: datedInstant(date, 0, "09:30"), location: "Auditorium", campusId: "main" },
    { id: "welcome-session", title: "Welcome session", startsAt: datedInstant(date, 0, "10:00"), endsAt: datedInstant(date, 0, "11:00"), location: "Seminar room 204", campusId: "main" },
    { id: "open-rehearsal", title: "Open rehearsal", startsAt: datedInstant(date, 0, "12:00"), endsAt: datedInstant(date, 0, "13:00"), location: "Studio A", campusId: "main" },
  ];
}

function includesSearch(value: string, search: string | undefined): boolean {
  return !search || value.toLocaleLowerCase().includes(search.toLocaleLowerCase());
}

/** Mirrors the read-only BFF endpoints used by the existing screens and hooks. */
export function getStaticDemoResponse(
  path: string,
  query: Record<string, string> | undefined,
): EventsResponse | RoomsResponse | ScheduleResponse | TodayResponse {
  const date = queryDate(query, path === "/schedule" ? "from" : "date");
  if (path === "/events") {
    const events = demoEvents(date).filter((event) => includesSearch(event.title, query?.search));
    return { events, _total: events.length, _sourcesConfigured: true };
  }
  if (path === "/rooms") {
    const filteredRooms = rooms.filter((room) => includesSearch(room.name, query?.search));
    return { rooms: filteredRooms, _total: filteredRooms.length, _sourcesConfigured: true };
  }
  if (path === "/schedule") {
    const schedule = demoSchedule(date).filter((item) => includesSearch(item.title, query?.search));
    return { schedule, _total: schedule.length, _sourcesConfigured: true };
  }
  if (path === "/today") {
    return { events: demoEvents(date), rooms, _degraded: false, _sourcesConfigured: true };
  }
  throw new Error(`Static demo does not provide ${path}`);
}
