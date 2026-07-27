/** Preflights the number of eligible recurring ICS events before expansion. */

import { isRecurrenceEligible, parseIcsDate, type RecurrencePreflightOptions } from "./recurrence";
import { forEachValidIcsEvent, type EventAccumulator } from "./icsEventStream";

/** Counts recurrence candidates that can pass preflight without expanding them. */
export function countRecurringEvents(ics: string, options: Omit<RecurrencePreflightOptions, "dtStart">): number {
  let count = 0;
  forEachValidIcsEvent(ics, (event) => {
    if (isCountableRecurring(event, options)) count += 1;
  });
  return count;
}

function isCountableRecurring(event: EventAccumulator, options: Omit<RecurrencePreflightOptions, "dtStart">): boolean {
  const summary = event.current.SUMMARY?.value.trim();
  const start = event.current.DTSTART;
  const rule = event.current.RRULE?.value.trim();
  if (!summary || !start?.value.trim() || !rule) return false;
  try {
    parseIcsDate(start.value.trim(), start.params.TZID);
    const end = event.current.DTEND;
    if (end?.value) parseIcsDate(end.value, end.params.TZID);
    return isRecurrenceEligible(rule, { ...options, dtStart: start });
  } catch { return false; }
}
