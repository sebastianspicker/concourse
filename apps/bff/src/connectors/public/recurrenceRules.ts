import { createHash } from "node:crypto";
import { RRule, RRuleSet, rrulestr } from "rrule";
import {
  floatingDateFromIcsValue,
  floatingDateToInstant,
  instantToFloatingDate,
  parseIcsDate,
  recurrenceTimeZone
} from "./recurrenceDate";
import type {
  IcsDateProperty,
  ParsedIcsEvent,
  RecurrenceExpansionOptions,
  RecurrencePreflightOptions,
  RecurrenceWorkBudget
} from "./recurrence";

const RRULE_PREFIX = "RRULE:";
const EXPLICIT_BY_RULE_PART = /(?:^|;)BY[A-Z]+=/i;
const UTC_UNTIL_PATTERN = /(?:^|;)UNTIL=[^;]+Z(?:;|$)/i;
const MAX_RRULE_WORK_PER_EVENT = 10_000;
const UNSUPPORTED_RECURRENCE = -1;
const FREQUENCY_MILLISECONDS = [
  31_536_000_000,
  2_419_200_000,
  604_800_000,
  86_400_000,
  3_600_000,
  60_000,
  1000
];

/** Saturates a work-product estimate just above the per-event recurrence budget. */
function cappedWork(first: number, second: number): number {
  if (first === 0 || second === 0) return 0;
  return first > MAX_RRULE_WORK_PER_EVENT / second ? MAX_RRULE_WORK_PER_EVENT + 1 : first * second;
}

/** Estimates combinatorial BY-rule fan-out before recurrence expansion begins. */
function explicitByValueMultiplier(rruleValue: string): number {
  return rruleValue.replace(/^RRULE:/i, "").split(";").reduce((multiplier, part) => {
    if (!part.match(/^BY[A-Z]+=/i)) return multiplier;
    const valueCount = part.split("=", 2)[1]?.split(",").filter(Boolean).length ?? 0;
    return cappedWork(multiplier, Math.max(1, valueCount));
  }, 1);
}

/** Returns the fixed interval duration used for supported recurrence frequencies. */
function frequencyMilliseconds(frequency: number): number {
  return FREQUENCY_MILLISECONDS[frequency] ?? 1000;
}

/** Estimates elapsed recurrence steps to bound work skipped before the window. */
function recurrenceStepsBetween(start: Date, end: Date, rrule: RRule): number {
  if (end <= start) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / frequencyMilliseconds(rrule.options.freq) / Math.max(1, rrule.options.interval));
}

/** Accepts only finite declared COUNT values that fit the expansion policy. */
function isSupportedCount(declaredCount: number | null): boolean {
  return (declaredCount ?? 0) <= MAX_RRULE_WORK_PER_EVENT;
}

type RecurrenceWorkInput = {
  rrule: RRule;
  rruleValue: string;
  startDate: Date;
  fromDate: Date;
  horizonDate: Date;
  maxInstances: number;
  includePast: boolean;
  budget: RecurrenceWorkBudget;
};

/** Estimates future generated instances while accounting for rule fan-out and COUNT. */
function futureRecurrenceWork(input: RecurrenceWorkInput, multiplier: number, declaredCount: number | null): number {
  if (EXPLICIT_BY_RULE_PART.test(input.rruleValue)) {
    return cappedWork(recurrenceStepsBetween(input.fromDate, input.horizonDate, input.rrule), multiplier);
  }
  return Math.min(input.maxInstances, declaredCount ?? input.maxInstances);
}

/** Limits past-instance scanning so historical series cannot consume unbounded work. */
function recurrencePastLimit(includePast: boolean, declaredCount: number | null, priorWork: number): number {
  if (!includePast) return 0;
  return Math.min(declaredCount ?? priorWork + 1, MAX_RRULE_WORK_PER_EVENT);
}

/** Checks and reserves shared recurrence work before a costly expansion step. */
function canSpendRecurrenceWork(work: number, budget: RecurrenceWorkBudget): boolean {
  return work <= Math.min(MAX_RRULE_WORK_PER_EVENT, budget.remaining);
}

/** Derives the bounded number of pre-window candidates worth inspecting. */
function pastCandidateLimit(input: RecurrenceWorkInput): number {
  const { rrule, rruleValue, startDate, fromDate, includePast, budget } = input;
  const declaredCount = rrule.options.count;
  const multiplier = explicitByValueMultiplier(rruleValue);
  const priorWork = cappedWork(recurrenceStepsBetween(startDate, fromDate, rrule), multiplier);
  const futureWork = futureRecurrenceWork(input, multiplier, declaredCount);
  const pastLimit = recurrencePastLimit(includePast, declaredCount, priorWork);
  const estimatedWork = Math.max(1, priorWork + futureWork + pastLimit);
  if (!canSpendRecurrenceWork(estimatedWork, budget)) return UNSUPPORTED_RECURRENCE;
  budget.remaining -= estimatedWork;
  return pastLimit;
}

type ExdateParseInput = {
  properties: IcsDateProperty[];
  recurrenceZone?: string;
};

/** Parses EXDATE values into excluded instants using their declared property zones. */
function parseExdates(input: ExdateParseInput): Date[] {
  return input.properties.flatMap((property) => property.value.split(",").flatMap((part) => {
    try {
      const instant = new Date(parseIcsDate(part.trim(), property.params.TZID ?? input.recurrenceZone));
      return input.recurrenceZone ? [instantToFloatingDate(instant, input.recurrenceZone)] : [instant];
    } catch {
      return [];
    }
  }));
}

type RuleParseInput = {
  ruleValue: string;
  startDate: Date;
  timeZone?: string;
};

/** Rejects rule sets and adjusts UTC UNTIL values for floating-zone evaluation. */
function parseRule(input: RuleParseInput): RRule {
  const ruleString = input.ruleValue.startsWith(RRULE_PREFIX) ? input.ruleValue : `${RRULE_PREFIX}${input.ruleValue}`;
  const parsed = rrulestr(ruleString, { dtstart: input.startDate, tzid: null });
  if (parsed instanceof RRuleSet) throw new Error("Unsupported recurrence rule set");
  if (!input.timeZone || !parsed.options.until || !UTC_UNTIL_PATTERN.test(input.ruleValue)) return parsed;
  return new RRule({
    ...parsed.origOptions,
    dtstart: input.startDate,
    until: instantToFloatingDate(parsed.options.until, input.timeZone),
    tzid: null
  });
}

/** Returns the base event unchanged when recurrence expansion cannot proceed safely. */
function fallback(baseEvent: ParsedIcsEvent, exdates: Date[], recurrenceStart: Date): ParsedIcsEvent[] {
  return exdates.some((exdate) => exdate.getTime() === recurrenceStart.getTime()) ? [] : [baseEvent];
}

/** Applies exception dates to the parsed rule before enumerating occurrences. */
function occurrenceSource(rule: RRule, exdates: Date[]): RRule {
  if (exdates.length === 0) return rule;
  const set = new RRuleSet();
  set.rrule(rule);
  exdates.forEach((exdate) => set.exdate(exdate));
  return set;
}

type OccurrenceWindow = {
  source: RRule;
  startDate: Date;
  referenceDate: Date;
  horizonDate: Date;
  maxInstances: number;
  includePast: boolean;
  pastLimit: number;
};

/** Enumerates occurrences only inside the precomputed bounded recurrence window. */
function expandOccurrences(window: OccurrenceWindow): Date[] {
  const { source, startDate, referenceDate, horizonDate, maxInstances, includePast, pastLimit } = window;
  const upcoming = startDate <= horizonDate && referenceDate <= horizonDate
    ? source.between(startDate > referenceDate ? startDate : referenceDate, horizonDate, true, (_occurrence, index) => index < maxInstances)
    : [];
  if (!includePast || upcoming.length >= maxInstances) return upcoming;
  const past = source.between(startDate, referenceDate, true, (_occurrence, index) => index < pastLimit)
    .filter((occurrence) => occurrence < referenceDate);
  return upcoming.concat(past.slice(-(maxInstances - upcoming.length)));
}

/** Derives a stable identifier for one expanded occurrence from its start instant. */
function instanceId(baseId: string, startsAt: string): string {
  // This is intentionally local to recurrence expansion: the base id remains
  // stable while every expanded occurrence gets an independently routable key.
  return createHash("sha256").update(`${baseId}|${startsAt}`).digest("hex").slice(0, 16);
}

/** Maps recurrence instants to event copies while preserving duration and local time. */
function mapOccurrences(baseEvent: ParsedIcsEvent, occurrences: Date[], timeZone?: string): ParsedIcsEvent[] {
  const duration = baseEvent.endsAt ? Date.parse(baseEvent.endsAt) - Date.parse(baseEvent.startsAt) : 0;
  return occurrences.sort((a, b) => a.getTime() - b.getTime()).map((occurrence) => {
    const instant = timeZone ? floatingDateToInstant(occurrence, timeZone) : occurrence;
    const startsAt = instant.toISOString();
    const recurringInstanceId = instanceId(baseEvent.id, startsAt);
    return {
      ...baseEvent,
      id: recurringInstanceId,
      startsAt,
      endsAt: duration > 0 ? new Date(instant.getTime() + duration).toISOString() : baseEvent.endsAt,
      isRecurring: true,
      recurringInstanceId
    };
  });
}

type RecurrenceWindowContext = {
  timeZone?: string;
  startDate: Date;
  referenceDate: Date;
  horizonDate: Date;
};

/** Precomputes the horizon and work limits shared by recurrence preflight and expansion. */
function recurrenceWindowContext(options: RecurrencePreflightOptions): RecurrenceWindowContext {
  const timeZone = recurrenceTimeZone(options.dtStart);
  const startDate = timeZone
    ? floatingDateFromIcsValue(options.dtStart.value)
    : new Date(parseIcsDate(options.dtStart.value, options.dtStart.params.TZID));
  const horizon = new Date(options.referenceDate.getTime() + options.horizonDays * 86_400_000);
  return {
    timeZone,
    startDate,
    referenceDate: timeZone ? instantToFloatingDate(options.referenceDate, timeZone) : options.referenceDate,
    horizonDate: timeZone ? instantToFloatingDate(horizon, timeZone) : horizon
  };
}

/** Checks whether a recurrence can be safely expanded within the supplied limits. */
export function isRecurrenceEligible(ruleValue: string, options: RecurrencePreflightOptions): boolean {
  if (options.maxInstances === 0) return true;
  try {
    const window = recurrenceWindowContext(options);
    const rule = parseRule({ ruleValue, startDate: window.startDate, timeZone: window.timeZone });
    if (!isSupportedCount(rule.options.count)) return false;
    const limit = pastCandidateLimit({
      rrule: rule,
      rruleValue: ruleValue,
      startDate: window.startDate,
      fromDate: window.startDate > window.referenceDate ? window.startDate : window.referenceDate,
      horizonDate: window.horizonDate,
      maxInstances: options.maxInstances,
      includePast: rule.options.count != null || rule.options.until != null,
      budget: { remaining: MAX_RRULE_WORK_PER_EVENT }
    });
    return limit !== UNSUPPORTED_RECURRENCE;
  } catch { return false; }
}

/** Expands a bounded RRULE with RFC 5545 timezone and EXDATE semantics. */
/** Expands a recurrence without exceeding horizon, instance, or shared work budgets. */
export function expandRecurringEvent(baseEvent: ParsedIcsEvent, ruleValue: string, options: RecurrenceExpansionOptions): ParsedIcsEvent[] {
  if (options.maxInstances === 0) return [];
  let startDate = new Date(baseEvent.startsAt);
  let exdates: Date[] = [];
  try {
    const window = recurrenceWindowContext(options);
    startDate = window.startDate;
    exdates = parseExdates({ properties: options.exdates, recurrenceZone: window.timeZone });
    const rule = parseRule({ ruleValue, startDate, timeZone: window.timeZone });
    if (!isSupportedCount(rule.options.count)) return fallback(baseEvent, exdates, startDate);

    const includePast = rule.options.count != null || rule.options.until != null;
    const fromDate = startDate > window.referenceDate ? startDate : window.referenceDate;
    const limit = pastCandidateLimit({
      rrule: rule,
      rruleValue: ruleValue,
      startDate,
      fromDate,
      horizonDate: window.horizonDate,
      maxInstances: options.maxInstances,
      includePast,
      budget: options.workBudget
    });
    if (limit === UNSUPPORTED_RECURRENCE) return fallback(baseEvent, exdates, startDate);
    return mapOccurrences(
      baseEvent,
      expandOccurrences({
        source: occurrenceSource(rule, exdates),
        startDate,
        referenceDate: window.referenceDate,
        horizonDate: window.horizonDate,
        maxInstances: options.maxInstances,
        includePast,
        pastLimit: limit
      }),
      window.timeZone
    );
  } catch {
    return fallback(baseEvent, exdates, startDate);
  }
}
