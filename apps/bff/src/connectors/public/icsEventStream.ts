/** Streams bounded, validated VEVENT property maps from untrusted ICS text. */

import { type IcsDateProperty } from "./recurrence";
import { MAX_ICS_LOGICAL_LINE_LENGTH, scanUnfoldedLines, type ScannedIcsLine } from "./icsLineScanner";
import { parseIcsParams } from "./icsParams";

export type IcsPropertyMap = Record<string, IcsDateProperty>;
export type EventAccumulator = { current: IcsPropertyMap; exdates: IcsDateProperty[]; propertyCount: number; propertyBytes: number; exdateBytes: number; invalid: boolean };
type IcsEventStreamState = { activeEvent: EventAccumulator | undefined; onEvent: (event: EventAccumulator) => void };

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
  const stream = new IcsEventStream(onEvent);
  for (const scannedLine of scanUnfoldedLines(ics)) stream.accept(scannedLine);
}

/** Owns VEVENT lifecycle state so scanner transitions cannot leak across components. */
class IcsEventStream {
  private readonly state: IcsEventStreamState;

  constructor(onEvent: (event: EventAccumulator) => void) {
    this.state = { activeEvent: undefined, onEvent };
  }

  /** Accepts one scanner result and applies exactly one VEVENT lifecycle transition. */
  accept(scannedLine: ScannedIcsLine): void {
    if (scannedLine.oversized) return this.invalidateForOversizedLine();
    if (isEventStart(scannedLine.value)) return this.startEvent();
    if (isEventEnd(scannedLine.value)) return this.finishEvent();
    if (this.state.activeEvent) this.collectActiveEventProperty(scannedLine.value);
  }

  /** Starts a fresh VEVENT, replacing any unterminated active event. */
  private startEvent(): void {
    this.state.activeEvent = createEventAccumulator();
  }

  /** Emits an active valid VEVENT before clearing all state for the next component. */
  private finishEvent(): void {
    const event = this.state.activeEvent;
    if (event && !event.invalid) this.state.onEvent(event);
    this.state.activeEvent = undefined;
  }

  /** Marks only the active VEVENT invalid when its unfolded line exceeds the scanner budget. */
  private invalidateForOversizedLine(): void {
    if (this.state.activeEvent) this.state.activeEvent.invalid = true;
  }

  /** Records an ordinary line after accept has established that a VEVENT is active. */
  private collectActiveEventProperty(line: string): void {
    collectProperty(line, this.state.activeEvent!);
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
