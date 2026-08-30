export function getCampusDateKey(input: Date | string, timeZone: string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date value: ${String(input)}`);

  const fields = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => fields.find((field) => field.type === type)?.value;
  const year = value("year");
  const month = value("month");
  const day = value("day");
  if (!year || !month || !day) throw new Error(`Unable to format date in ${timeZone}`);
  return `${year}-${month}-${day}`;
}
