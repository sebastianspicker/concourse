/** Fetches, parses, caches, and degrades gracefully for public schedule sources. */

import type { InstitutionPack } from "@concourse/institutions";
import { isPublicHttpUrl, type ScheduleItem } from "@concourse/contracts";
import { getCached } from "../../runtime/cache";
import { fetchTextWithTimeout } from "../../runtime/httpClient";
import { log } from "../../runtime/logger";

import { parseIcs, type ParsedIcsEvent } from "./icsParser";
import { getPublicSourceBreaker } from "../../runtime/sourceBreakerRegistry";

import { BFF_ENV } from "../../runtime/config";

export type FetchPublicScheduleResult = { schedule: ScheduleItem[]; degraded: boolean };
type ScheduleSource = { url: string; label: string };
type SettledScheduleSource = PromiseSettledResult<ParsedIcsEvent[]>;

function toScheduleItem(p: ParsedIcsEvent): ScheduleItem {
  return {
    id: p.id,
    title: p.title,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    location: p.location,
    campusId: p.campusId,
    description: p.description,
  };
}

/** Fetches and parses one source through its source-scoped circuit breaker. */
async function loadScheduleSource(source: ScheduleSource, signal: AbortSignal): Promise<ParsedIcsEvent[]> {
  const text = await getPublicSourceBreaker("public-schedule", source.url).call(
    () => fetchTextWithTimeout(source.url, { signal })
  );
  return parseIcs(text, { rruleHorizonDays: BFF_ENV.rruleExpansionHorizonDays });
}

/** Logs a failed source and returns no events so successful sources remain usable. */
function scheduleItemsFromSettledSource(source: ScheduleSource, result: SettledScheduleSource): ScheduleItem[] {
  if (result.status === "fulfilled") return result.value.map(toScheduleItem);

  log("warn", "public_schedule_source_failed", {
    source: source.label,
    reason: "upstream_request_failed"
  });
  return [];
}

/** Combines settled sources in configured order and retains partial-data degradation. */
function combineScheduleSources(
  sources: ScheduleSource[],
  settledSources: SettledScheduleSource[],
  hasRejectedSource: boolean
): FetchPublicScheduleResult {
  const schedule = settledSources.flatMap((result, index) =>
    scheduleItemsFromSettledSource(sources[index], result)
  );
  const degraded = hasRejectedSource || settledSources.some((result) => result.status === "rejected");
  return { schedule, degraded };
}

/** Fetches configured sources independently while surfacing total upstream failure. */
async function loadScheduleSources(
  sources: ScheduleSource[],
  signal: AbortSignal,
  hasRejectedSource: boolean
): Promise<FetchPublicScheduleResult> {
  const settledSources = await Promise.allSettled(
    sources.map((source) => loadScheduleSource(source, signal))
  );

  if (hasRejectedSource && sources.length === 0) {
    throw new Error("All public schedule sources failed");
  }
  if (settledSources.length > 0 && settledSources.every((result) => result.status === "rejected")) {
    throw new Error("All public schedule sources failed");
  }

  return combineScheduleSources(sources, settledSources, hasRejectedSource);
}

/** Fetches configured ICS sources independently and returns partial data when one fails. */
export async function fetchPublicSchedule(
  institution: InstitutionPack
): Promise<FetchPublicScheduleResult> {
  const configuredSources = institution.publicSources?.schedules ?? [];
  const sources = configuredSources.filter((source): source is ScheduleSource => isPublicHttpUrl(source.url));
  const hasRejectedSource = sources.length !== configuredSources.length;
  const cacheKey = `public-schedule:${institution.id}`;
  const ttlMs = BFF_ENV.defaultCacheTtl * 1000;
  const loader = (signal: AbortSignal) => loadScheduleSources(sources, signal, hasRejectedSource);

  return getCached(
    cacheKey,
    loader,
    ttlMs,
    { shouldCache: (result) => !result.degraded }
  );
}
