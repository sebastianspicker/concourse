import { createHash } from "node:crypto";
import { RRule, RRuleSet, rrulestr } from "rrule";
import { parseDateTimeInTimeZone } from "../../utils/timeZone";

export type ParsedIcsEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  campusId?: string;
  description?: string;
  isRecurring?: boolean;
  recurringInstanceId?: string;
};

// Bound open-ended RRULEs so a single public calendar entry cannot produce an
// unbounded response or dominate request time.
const DEFAULT_RRULE_HORIZON_DAYS = 90;
const DEFAULT_RRULE_MAX_INSTANCES = 100;

function generateStableId(title: string, startsAt: string): string {
  // Some public ICS feeds omit UID. A deterministic fallback keeps client
  // cache keys and navigation targets stable across fetches.
  return createHash("sha256")
    .update(`${title}|${startsAt}`)
    .digest("hex")
    .slice(0, 16);
}

function generateRecurringInstanceId(baseId: string, startsAt: string): string {
  // Recurring instances need separate ids because they can be rendered,
  // paginated, and opened independently in the mobile app.
  return createHash("sha256")
    .update(`${baseId}|${startsAt}`)
    .digest("hex")
    .slice(0, 16);
}

function unfoldLines(input: string): string[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const unfolded: string[] = [];

  for (const line of lines) {
    // RFC 5545 Section 3.1: Long content lines are folded by inserting a CRLF
    // followed by a single whitespace character (SPACE or HTAB). We unfold by
    // detecting a leading space or tab and appending the rest to the previous line.
    // Note: per the RFC, only a single leading whitespace character is the fold
    // indicator. If a line has multiple leading spaces/tabs, only the first is
    // stripped. Additional whitespace is considered part of the property value.
    if (line.startsWith(" ") || line.startsWith("\t")) {
      const prev = unfolded.pop() ?? "";
      unfolded.push(prev + line.slice(1));
      continue;
    }
    unfolded.push(line);
  }

  return unfolded;
}

function parseIcsDate(value: string, tzid?: string): string {
  // DATE (all-day)
  if (/^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    // All-day ICS values have no timezone or wall-clock time. Store a stable
    // midnight UTC boundary and leave display localization to the client.
    const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ICS date: ${value}`);
    }
    return date.toISOString();
  }

  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z|[+-]\d{4}|[+-]\d{2}:\d{2})?$/
  );
  if (!match) {
    throw new Error(`Invalid ICS date: ${value}`);
  }

  const [, year, month, day, hour, minute, second = "00", suffix] = match;
  if (suffix === "Z") {
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ICS date: ${value}`);
    }
    return date.toISOString();
  }

  if (suffix && suffix !== "Z") {
    const normalizedOffset = suffix.includes(":")
      ? suffix
      : `${suffix.slice(0, 3)}:${suffix.slice(3)}`;
    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${normalizedOffset}`);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid ICS date: ${value}`);
    }
    return date.toISOString();
  }

  if (tzid) {
    return parseDateTimeInTimeZone(
      {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second)
      },
      tzid
    );
  }

  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ICS date: ${value}`);
  }
  return date.toISOString();
}

function unescapeIcsValue(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * Expand a recurring event based on its RRULE.
 * Returns an array of events, one for each occurrence within the horizon.
 */
function expandRecurringEvent(
  baseEvent: ParsedIcsEvent,
  rruleValue: string,
  horizonDays: number = DEFAULT_RRULE_HORIZON_DAYS,
  maxInstances: number = DEFAULT_RRULE_MAX_INSTANCES,
  exdates: Date[] = []
): ParsedIcsEvent[] {
  try {
    const startDate = new Date(baseEvent.startsAt);
    const now = new Date();
    const horizonDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

    // rrulestr expects the rule to start with "RRULE:" even though many feeds
    // store only the property value after parsing.
    const ruleString = rruleValue.startsWith("RRULE:") ? rruleValue : `RRULE:${rruleValue}`;

    let rrule: RRule;
    try {
      rrule = rrulestr(ruleString, { dtstart: startDate });
    } catch {
      // Keep malformed recurrence rules from dropping the original event.
      return [baseEvent];
    }

    let occurrenceSource: { between(a: Date, b: Date, inc: boolean): Date[]; options: RRule["options"] };
    if (exdates.length > 0) {
      const ruleSet = new RRuleSet();
      ruleSet.rrule(rrule);
      for (const exdate of exdates) {
        ruleSet.exdate(exdate);
      }
      occurrenceSource = ruleSet as unknown as typeof occurrenceSource;
      // RRuleSet doesn't expose .options directly, proxy through the base rrule
      occurrenceSource.options = rrule.options;
    } else {
      occurrenceSource = rrule;
    }

    // For COUNT/UNTIL-constrained rules, use the event's own start date as the lower
    // bound so all declared instances are returned (even if some are in the past).
    // For open-ended rules, use now so we only fetch upcoming occurrences.
    // Route-level applyDateRange handles further filtering in both cases.
    const hasFiniteConstraint = rrule.options.count != null || rrule.options.until != null;
    const fromDate = hasFiniteConstraint ? startDate : now;
    const occurrences = occurrenceSource.between(fromDate, horizonDate, true);

    const limitedOccurrences = occurrences.slice(0, maxInstances);

    if (limitedOccurrences.length === 0) {
      return [baseEvent];
    }

    return limitedOccurrences.map((occurrence) => {
      const instanceStartsAt = occurrence.toISOString();
      const duration = baseEvent.endsAt
        ? new Date(baseEvent.endsAt).getTime() - new Date(baseEvent.startsAt).getTime()
        : 0;

      return {
        ...baseEvent,
        id: generateRecurringInstanceId(baseEvent.id, instanceStartsAt),
        startsAt: instanceStartsAt,
        endsAt: duration > 0
          ? new Date(occurrence.getTime() + duration).toISOString()
          : baseEvent.endsAt,
        isRecurring: true,
        recurringInstanceId: generateRecurringInstanceId(baseEvent.id, instanceStartsAt)
      };
    });
  } catch {
    // Recurrence expansion is best-effort. A bad RRULE should not hide the
    // event itself.
    return [baseEvent];
  }
}

export interface ParseIcsOptions {
  /** Number of days to expand recurring events into the future */
  rruleHorizonDays?: number;
  /** Maximum number of instances per recurring event */
  rruleMaxInstances?: number;
}

export function parseIcs(ics: string, options?: ParseIcsOptions): ParsedIcsEvent[] {
  const lines = unfoldLines(ics);
  const events: ParsedIcsEvent[] = [];

  const horizonDays = options?.rruleHorizonDays ?? DEFAULT_RRULE_HORIZON_DAYS;
  const maxInstances = options?.rruleMaxInstances ?? DEFAULT_RRULE_MAX_INSTANCES;

  let current: Record<string, { value: string; params: Record<string, string> }> =
    {};
  let currentExdates: string[] = [];
  let inEvent = false;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      current = {};
      currentExdates = [];
      continue;
    }
    if (line === "END:VEVENT") {
      inEvent = false;
      const uid = current.UID?.value?.trim();
      const summary = current.SUMMARY?.value?.trim();
      const dtStart = current.DTSTART?.value?.trim();
      const rrule = current.RRULE?.value?.trim();

      if (summary && dtStart) {
        try {
          const startsAt = parseIcsDate(dtStart, current.DTSTART?.params?.TZID);
          const baseEvent: ParsedIcsEvent = {
            id: uid || generateStableId(summary, startsAt),
            title: unescapeIcsValue(summary),
            startsAt,
            endsAt: current.DTEND?.value ? parseIcsDate(current.DTEND.value, current.DTEND?.params?.TZID) : undefined,
            location: current.LOCATION?.value ? unescapeIcsValue(current.LOCATION.value.trim()) : undefined,
            campusId:
              current["X-CAMPUS-ID"]?.value?.trim() ||
              current["X-CAMPUS"]?.value?.trim() ||
              undefined,
            description: current.DESCRIPTION?.value ? unescapeIcsValue(current.DESCRIPTION.value.trim()) : undefined
          };

          if (rrule) {
            const parsedExdates: Date[] = [];
            for (const exdateStr of currentExdates) {
              for (const datePart of exdateStr.split(",")) {
                const trimmed = datePart.trim();
                if (trimmed) {
                  try {
                    parsedExdates.push(new Date(parseIcsDate(trimmed)));
                  } catch {
                    // Invalid EXDATE values should not invalidate the parent event.
                  }
                }
              }
            }
            const expandedEvents = expandRecurringEvent(baseEvent, rrule, horizonDays, maxInstances, parsedExdates);
            events.push(...expandedEvents);
          } else {
            events.push(baseEvent);
          }
        } catch {
          // Skip event with invalid date
        }
      }

      current = {};
      currentExdates = [];
      continue;
    }

    if (!inEvent) continue;
    if (!line.includes(":")) continue;

    const [rawKey, ...rest] = line.split(":");
    const value = rest.join(":");
    if (!rawKey) continue;

    const [key, ...paramParts] = rawKey.split(";");
    const params: Record<string, string> = {};
    for (const part of paramParts) {
      const [pKey, pVal] = part.split("=");
      if (pKey && pVal) {
        // Quoted parameter values are valid ICS syntax, e.g. TZID="Europe/Berlin".
        params[pKey] = pVal.replace(/^"(.*)"$/, "$1");
      }
    }

    if (key === "EXDATE") {
      currentExdates.push(value.trim());
    }

    current[key] = { value: value.trim(), params };
  }

  return events.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : a.id.localeCompare(b.id)));
}
