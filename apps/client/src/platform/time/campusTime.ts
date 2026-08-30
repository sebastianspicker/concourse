/** Calculates campus-local dates and day boundaries across time-zone and DST transitions. */
type CampusDateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-US", { day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit", month: "2-digit", second: "2-digit", timeZone, year: "numeric" });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function dateParts(date: Date, timeZone: string): CampusDateParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function dateKey(parts: CampusDateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

const HOUR_MS = 60 * 60 * 1000;
const CAMPUS_BOUNDARY_SEARCH_RADIUS_MS = 48 * HOUR_MS;

function isTargetCampusDate(timestamp: number, targetKey: string, timeZone: string): boolean {
  return dateKey(dateParts(new Date(timestamp), timeZone)) === targetKey;
}

function refineCampusDateBoundary(lower: number, upper: number, targetKey: string, timeZone: string): Date {
  while (upper - lower > 1) {
    const midpoint = lower + Math.floor((upper - lower) / 2);
    if (isTargetCampusDate(midpoint, targetKey, timeZone)) upper = midpoint;
    else lower = midpoint;
  }
  return new Date(upper);
}

function startOfCampusDate(parts: CampusDateParts, timeZone: string): Date {
  const targetKey = dateKey(parts);
  const nominalUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  const searchStart = nominalUtc - CAMPUS_BOUNDARY_SEARCH_RADIUS_MS;
  const searchEnd = nominalUtc + CAMPUS_BOUNDARY_SEARCH_RADIUS_MS;
  for (let probe = searchStart; probe <= searchEnd; probe += HOUR_MS) {
    if (isTargetCampusDate(probe, targetKey, timeZone)) return refineCampusDateBoundary(probe - HOUR_MS, probe, targetKey, timeZone);
  }
  throw new Error(`Unable to resolve campus date ${targetKey} in ${timeZone}`);
}

function nextDateParts(parts: CampusDateParts): CampusDateParts {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate(), hour: 0, minute: 0, second: 0 };
}

/** Returns the configured campus date, independent of the device timezone. */
export function getCampusDate(date: Date, timeZone: string): string { return dateKey(dateParts(date, timeZone)); }

/** Returns DST-safe UTC bounds for the campus day containing `date`. */
export function getCampusDayRange(date: Date, timeZone: string): { from: string; to: string } {
  const startParts = dateParts(date, timeZone);
  const start = startOfCampusDate(startParts, timeZone);
  const nextStart = startOfCampusDate(nextDateParts(startParts), timeZone);
  return { from: start.toISOString(), to: new Date(nextStart.getTime() - 1).toISOString() };
}

/** Milliseconds until the next configured-campus midnight. */
export function millisecondsUntilNextCampusDay(date: Date, timeZone: string): number {
  const currentParts = dateParts(date, timeZone);
  const nextStart = startOfCampusDate(nextDateParts(currentParts), timeZone);
  return Math.max(1, nextStart.getTime() - date.getTime());
}
