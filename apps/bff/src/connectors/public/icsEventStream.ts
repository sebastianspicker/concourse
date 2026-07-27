/** Streams bounded, validated VEVENT property maps from untrusted ICS text. */

import { type IcsDateProperty } from "./recurrence";
import { MAX_ICS_LOGICAL_LINE_LENGTH, scanUnfoldedLines } from "./icsLineScanner";
import { parseIcsParams } from "./icsParams";

export type IcsPropertyMap = Record<string, IcsDateProperty>;
export type EventAccumulator = { current: IcsPropertyMap; exdates: IcsDateProperty[]; propertyCount: number; propertyBytes: number; exdateBytes: number; invalid: boolean };

const BEGIN_EVENT_LINE = "BEGIN:VEVENT";
const END_EVENT_LINE = "END:VEVENT";
const MAX_RRULE_VALUE_LENGTH = 16_384;
const MAX_ICS_PROPERTY_NAME_LENGTH = 64;
const MAX_ICS_PROPERTY_METADATA_LENGTH = 16_384;
const MAX_ICS_PROPERTIES_PER_EVENT = 1_024;
const MAX_ICS_EVENT_PROPERTY_BYTES = 256 * 1024;
const MAX_ICS_EXDATES_PER_EVENT = 512;
const MAX_ICS_EXDATE_BYTES = 64 * 1024;
const KNOWN_PROPERTIES = ["UID", "SUMMARY", "DTSTART", "DTEND", "LOCATION", "X-CAMPUS-ID", "X-CAMPUS", "DESCRIPTION", "RRULE", "EXDATE"];

/** Visits only bounded, structurally valid VEVENTs from an untrusted ICS document. */
export function forEachValidIcsEvent(ics: string, onEvent: (event: EventAccumulator) => void): void {
  let event = createEventAccumulator();
  let inEvent = false;
  for (const scannedLine of scanUnfoldedLines(ics)) {
    if (scannedLine.oversized) {
      if (inEvent) event.invalid = true;
      continue;
    }
    const line = scannedLine.value;
    if (isEventStart(line)) {
      inEvent = true;
      event = createEventAccumulator();
    } else if (isEventEnd(line)) {
      if (inEvent && !event.invalid) onEvent(event);
      inEvent = false;
      event = createEventAccumulator();
    } else if (inEvent) {
      collectProperty(line, event);
    }
  }
}

const isEventStart = (line: string): boolean => line.length === BEGIN_EVENT_LINE.length && line.toUpperCase() === BEGIN_EVENT_LINE;
const isEventEnd = (line: string): boolean => line.length === END_EVENT_LINE.length && line.toUpperCase() === END_EVENT_LINE;

/** Records a property only while per-event count and byte budgets remain intact. */
const collectProperty = (line: string, event: EventAccumulator): void => {
  if (event.invalid) return;
  const key = knownPropertyName(line);
  if (!key || propertyExceedsBounds(line, event)) return;
  const parsed = parseProperty(line);
  if (parsed.overflowed) { event.invalid = true; return; }
  recordProperty(event, key, parsed.property);
}

/** Limits parsing to the VEVENT properties the downstream event model understands. */
const knownPropertyName = (line: string): string | undefined => {
  const valueOffset = line.indexOf(":");
  const parameterOffset = line.indexOf(";");
  const keyEnd = parameterOffset < 0 || parameterOffset > valueOffset ? valueOffset : parameterOffset;
  if (valueOffset < 1 || keyEnd > MAX_ICS_PROPERTY_NAME_LENGTH) return undefined;
  return KNOWN_PROPERTIES.find((key) => matchesAsciiPropertyName(line, keyEnd, key));
}

/** Compares a property prefix as ASCII to avoid locale-sensitive name matching. */
const matchesAsciiPropertyName = (line: string, length: number, expected: string): boolean => {
  if (length !== expected.length) return false;
  for (let index = 0; index < length; index += 1) {
    const code = line.charCodeAt(index);
    const normalized = code >= 97 && code <= 122 ? code - 32 : code;
    if (normalized !== expected.charCodeAt(index)) return false;
  }
  return true;
};

/** Rejects an event once property count or accumulated property bytes exceed limits. */
const propertyExceedsBounds = (line: string, event: EventAccumulator): boolean => {
  const valueOffset = line.indexOf(":");
  const oversized = valueOffset > MAX_ICS_PROPERTY_METADATA_LENGTH || line.length - valueOffset - 1 > MAX_ICS_LOGICAL_LINE_LENGTH || event.propertyCount >= MAX_ICS_PROPERTIES_PER_EVENT;
  if (oversized) event.invalid = true;
  return oversized;
}

/** Splits a bounded ICS property into metadata and value for later validation. */
const parseProperty = (line: string): { property: IcsDateProperty; overflowed: boolean } => {
  const valueOffset = line.indexOf(":");
  const rawKey = line.slice(0, valueOffset);
  const parameterOffset = rawKey.indexOf(";");
  const parsedParams = parseIcsParams(parameterOffset < 0 ? "" : rawKey.slice(parameterOffset + 1));
  return { property: { value: line.slice(valueOffset + 1).trim(), params: parsedParams.params }, overflowed: parsedParams.overflowed };
}

/** Retains EXDATE values separately under their own count and byte budgets. */
const recordExdate = (event: EventAccumulator, property: IcsDateProperty): void => {
  event.exdateBytes += property.value.length;
  if (event.exdates.length >= MAX_ICS_EXDATES_PER_EVENT || event.exdateBytes > MAX_ICS_EXDATE_BYTES) { event.invalid = true; return; }
  event.exdates.push(property);
}

/** Retains one supported property while routing repeated EXDATE values separately. */
const recordProperty = (event: EventAccumulator, key: string, property: IcsDateProperty): void => {
  event.propertyCount += 1;
  event.propertyBytes += property.value.length;
  if (event.propertyBytes > MAX_ICS_EVENT_PROPERTY_BYTES || (key === "RRULE" && property.value.length > MAX_RRULE_VALUE_LENGTH)) { event.invalid = true; return; }
  if (key === "EXDATE") recordExdate(event, property);
  event.current[key] = property;
}

/** Creates fresh per-VEVENT accounting so malformed events cannot leak parser state. */
const createEventAccumulator = (): EventAccumulator => {
  return { current: {}, exdates: [], propertyCount: 0, propertyBytes: 0, exdateBytes: 0, invalid: false };
}
