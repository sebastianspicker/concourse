type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

function toPartsRecord(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function getDateTimeParts(date: Date, timeZone: string): DateTimeParts {
  const parts = toPartsRecord(getFormatter(timeZone).formatToParts(date));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getDateTimeParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );
  return asUtc - date.getTime();
}

export function getDateKeyInTimeZone(input: Date | string, timeZone: string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${String(input)}`);
  }

  const parts = getDateTimeParts(date, timeZone);
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function parseDateTimeInTimeZone(
  parts: DateTimeParts,
  timeZone: string
): string {
  const targetUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    0
  );

  let candidateUtc = targetUtc;
  for (let i = 0; i < 4; i += 1) {
    const offsetMs = getTimeZoneOffsetMs(new Date(candidateUtc), timeZone);
    const nextCandidateUtc = targetUtc - offsetMs;
    if (nextCandidateUtc === candidateUtc) {
      break;
    }
    candidateUtc = nextCandidateUtc;
  }

  const resolved = new Date(candidateUtc);
  const resolvedParts = getDateTimeParts(resolved, timeZone);
  if (
    resolvedParts.year !== parts.year ||
    resolvedParts.month !== parts.month ||
    resolvedParts.day !== parts.day ||
    resolvedParts.hour !== parts.hour ||
    resolvedParts.minute !== parts.minute ||
    resolvedParts.second !== parts.second
  ) {
    throw new Error(`Invalid ${timeZone} local datetime`);
  }

  return resolved.toISOString();
}
