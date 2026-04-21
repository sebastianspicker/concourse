import { createHash } from "node:crypto";
import { RRule, RRuleSet, rrulestr } from "rrule";

export type ParsedIcsEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  campusId?: string;
  isRecurring?: boolean;
  recurringInstanceId?: string;
};

// Configuration for RRULE expansion
const DEFAULT_RRULE_HORIZON_DAYS = 90; // Expand events up to 3 months in the future by default
const DEFAULT_RRULE_MAX_INSTANCES = 100; // Maximum instances per recurring event

// #66: Stable fallback ID when UID is missing
function generateStableId(title: string, startsAt: string): string {
  return createHash("sha256")
    .update(`${title}|${startsAt}`)
    .digest("hex")
    .slice(0, 16);
}

// Generate ID for recurring event instance
function generateRecurringInstanceId(baseId: string, startsAt: string): string {
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

function parseIcsDate(value: string, _tzid?: string): string {
  let date: Date;
  // DATE (all-day)
  if (/^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    // For all-day events, use UTC
    date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  } else {
    const normalized = value.replace(/Z$/, "").replace(/[+-]\d{2}:\d{2}$/, "");
    const year = normalized.slice(0, 4);
    const month = normalized.slice(4, 6);
    const day = normalized.slice(6, 8);
    const hour = normalized.slice(9, 11);
    const minute = normalized.slice(11, 13);
    const second = normalized.slice(13, 15) || "00";
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.000`;

    // Always interpret as UTC. When TZID is present the offset was already stripped
    // in the normalization above, leaving a floating datetime. Appending Z ensures
    // consistent UTC interpretation regardless of the server's local timezone.
    date = new Date(`${iso}Z`);
  }

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
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

    // Parse the RRULE string
    // rrulestr expects the rule to start with "RRULE:"
    const ruleString = rruleValue.startsWith("RRULE:") ? rruleValue : `RRULE:${rruleValue}`;

    let rrule: RRule;
    try {
      rrule = rrulestr(ruleString, { dtstart: startDate });
    } catch {
      // If parsing fails, return just the base event
      return [baseEvent];
    }

    // Use RRuleSet when there are EXDATEs to exclude
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
    
    // Limit the number of instances
    const limitedOccurrences = occurrences.slice(0, maxInstances);
    
    if (limitedOccurrences.length === 0) {
      return [baseEvent];
    }

    // Create an event for each occurrence
    return limitedOccurrences.map((occurrence, index) => {
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
        recurringInstanceId: `${baseEvent.id}-${index}`
      };
    });
  } catch {
    // If expansion fails for any reason, return just the base event
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
              undefined
          };

          // Handle RRULE (recurring events)
          if (rrule) {
            // Parse collected EXDATE values into Date objects
            const parsedExdates: Date[] = [];
            for (const exdateStr of currentExdates) {
              // EXDATE can contain comma-separated dates
              for (const datePart of exdateStr.split(",")) {
                const trimmed = datePart.trim();
                if (trimmed) {
                  try {
                    parsedExdates.push(new Date(parseIcsDate(trimmed)));
                  } catch {
                    // Skip unparseable exdate values
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
        // #59: Strip double quotes from parameter values
        params[pKey] = pVal.replace(/^"(.*)"$/, "$1");
      }
    }

    // EXDATE can appear multiple times; collect all values
    if (key === "EXDATE") {
      currentExdates.push(value.trim());
    }

    current[key] = { value: value.trim(), params };
  }

  return events.sort((a, b) => (a.startsAt < b.startsAt ? -1 : a.startsAt > b.startsAt ? 1 : a.id.localeCompare(b.id)));
}
