/** Calculates campus-local dates and day boundaries across time-zone and DST transitions. */
import {
  getZonedDateTimeParts,
  type ZonedDateTimeParts
} from "@concourse/shared";

type CampusDateParts = ZonedDateTimeParts;

/** Extracts numeric local date parts in the configured campus time zone. */
function dateParts(date: Date, timeZone: string): CampusDateParts {
  return getZonedDateTimeParts(date, timeZone);
}

/** Serializes campus date parts into the sortable ISO calendar-day key. */
function dateKey(parts: CampusDateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

const HOUR_MS = 60 * 60 * 1000;
const CAMPUS_BOUNDARY_SEARCH_RADIUS_MS = 48 * HOUR_MS;

/** Tests a UTC instant against the desired campus calendar day during DST boundary searches. */
function isTargetCampusDate(timestamp: number, targetKey: string, timeZone: string): boolean {
  return dateKey(dateParts(new Date(timestamp), timeZone)) === targetKey;
}

/** Binary-searches the first instant belonging to a campus-local calendar day. */
function refineCampusDateBoundary(lower: number, upper: number, targetKey: string, timeZone: string): Date {
  while (upper - lower > 1) {
    const midpoint = lower + Math.floor((upper - lower) / 2);
    if (isTargetCampusDate(midpoint, targetKey, timeZone)) upper = midpoint;
    else lower = midpoint;
  }
  return new Date(upper);
}

/** Finds a DST-safe UTC midnight by probing the local date before refining its boundary. */
function startOfCampusDate(parts: CampusDateParts, timeZone: string): Date {
  const targetKey = dateKey(parts);
  const nominalUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const searchStart = nominalUtc - CAMPUS_BOUNDARY_SEARCH_RADIUS_MS;
  const searchEnd = nominalUtc + CAMPUS_BOUNDARY_SEARCH_RADIUS_MS;
  for (let probe = searchStart; probe <= searchEnd; probe += HOUR_MS) {
    if (isTargetCampusDate(probe, targetKey, timeZone)) {
      return refineCampusDateBoundary(probe - HOUR_MS, probe, targetKey, timeZone);
    }
  }
  throw new Error(`Unable to resolve campus date ${targetKey} in ${timeZone}`);
}

/** Advances a calendar date in UTC without adding a fixed day length across DST changes. */
function nextDateParts(parts: CampusDateParts): CampusDateParts {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: 0,
    minute: 0,
    second: 0,
  };
}

/** Returns the configured campus date, independent of the device timezone. */
export function getCampusDate(date: Date, timeZone: string): string {
  return dateKey(dateParts(date, timeZone));
}

/** Returns DST-safe UTC bounds for the campus day containing `date`. */
export function getCampusDayRange(date: Date, timeZone: string): { from: string; to: string } {
  const startParts = dateParts(date, timeZone);
  const start = startOfCampusDate(startParts, timeZone);
  const nextStart = startOfCampusDate(nextDateParts(startParts), timeZone);
  return {
    from: start.toISOString(),
    // BFF date ranges are inclusive, so exclude exactly midnight tomorrow.
    to: new Date(nextStart.getTime() - 1).toISOString(),
  };
}

/** Milliseconds until the next configured-campus midnight. */
export function millisecondsUntilNextCampusDay(date: Date, timeZone: string): number {
  const currentParts = dateParts(date, timeZone);
  const nextStart = startOfCampusDate(nextDateParts(currentParts), timeZone);
  return Math.max(1, nextStart.getTime() - date.getTime());
}
