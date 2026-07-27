/** Builds minimal parseable ICS calendars from VEVENT fixture bodies. */
export function icsCalendar(event: string): string {
  return icsCalendarEvents([event]);
}

/** Builds a minimal parseable ICS calendar containing the supplied VEVENTs. */
export function icsCalendarEvents(events: readonly string[]): string {
  return `BEGIN:VCALENDAR\n${events.map((event) => `BEGIN:VEVENT\n${event}\nEND:VEVENT`).join("\n")}\nEND:VCALENDAR`;
}
