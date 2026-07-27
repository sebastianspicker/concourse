/** Converts dates and wall-clock values across validated IANA time zones. */
import {
  getZonedDateTimeParts,
  type ZonedDateTimeParts,
  utcDateFromParts,
} from "@concourse/shared";

export type DateTimeParts = ZonedDateTimeParts;

/** Extracts calendar and clock fields for an instant in the requested IANA zone. */
export function getDateTimePartsInTimeZone(date: Date, timeZone: string): DateTimeParts {
  return getZonedDateTimeParts(date, timeZone);
}

/** Left-pads date and time fields to their required fixed width. */
function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

/** Computes the zone offset by comparing formatted local fields with the same UTC instant. */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getDateTimePartsInTimeZone(date, timeZone);
  const asUtc = utcDateFromParts(parts).getTime();
  return asUtc - date.getTime();
}

/** Produces the local YYYY-MM-DD key used to group events by institution date. */
export function getDateKeyInTimeZone(input: Date | string, timeZone: string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${String(input)}`);
  }

  const parts = getDateTimePartsInTimeZone(date, timeZone);
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Parses an ICS-style wall-clock timestamp in its declared IANA zone. */
export function parseDateTimeInTimeZone(
  parts: DateTimeParts,
  timeZone: string
): string {
  const targetWallTime = validatedUtcMillisecondsFromParts(parts);
  const candidates = getLocalTimeCandidates(targetWallTime, timeZone);
  const exactMatches = candidates
    .filter((candidate) => candidate.wallTime === targetWallTime)
    .sort((first, second) => first.instant - second.instant);

  if (exactMatches.length > 0) {
    // RFC 5545 requires the first occurrence when a local time is repeated
    // during a backward offset transition.
    return new Date(exactMatches[0].instant).toISOString();
  }

  const postGapCandidates = candidates
    .filter((candidate) => candidate.wallTime > targetWallTime)
    .sort((first, second) => first.wallTime - second.wallTime);
  if (postGapCandidates.length > 0) {
    // For a local time skipped by a forward transition, RFC 5545 applies the
    // offset from before the gap. That candidate is the nearest wall time
    // after the requested one.
    return new Date(postGapCandidates[0].instant).toISOString();
  }

  throw new Error(`Invalid ${timeZone} local datetime`);
}

const OFFSET_PROBE_WINDOW_MS = 48 * 60 * 60 * 1000;

type LocalTimeCandidate = {
  instant: number;
  wallTime: number;
};

/** Finds UTC instants that map to a requested local wall time, including DST ambiguity. */
function getLocalTimeCandidates(targetWallTime: number, timeZone: string): LocalTimeCandidate[] {
  const offsets = new Set<number>();
  for (const delta of [-OFFSET_PROBE_WINDOW_MS, 0, OFFSET_PROBE_WINDOW_MS]) {
    offsets.add(getTimeZoneOffsetMs(new Date(targetWallTime + delta), timeZone));
  }

  return [...offsets].map((offset) => {
    const instant = targetWallTime - offset;
    return {
      instant,
      wallTime: utcDateFromParts(getDateTimePartsInTimeZone(new Date(instant), timeZone)).getTime()
    };
  });
}

/** Serializes local date-time fields for exact candidate comparison. */
function comparableParts(parts: DateTimeParts): string {
  return [
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  ].join(":");
}

/** Rejects wall-clock fields that normalize to a different calendar instant. */
function validatedUtcMillisecondsFromParts(parts: DateTimeParts): number {
  const values = [parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second];
  const date = utcDateFromParts(parts);
  const normalized: DateTimeParts = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds()
  };
  if (!values.every(Number.isInteger) || Number.isNaN(date.getTime()) || comparableParts(normalized) !== comparableParts(parts)) {
    throw new Error("Invalid calendar datetime");
  }
  return date.getTime();
}
