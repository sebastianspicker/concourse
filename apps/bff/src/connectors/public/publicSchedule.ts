/** Fetches, parses, caches, and degrades gracefully for public schedule sources. */

import type { InstitutionPack } from "../../config/loader";
import { getCached } from "../../utils/cache";
import { fetchTextWithTimeout } from "../../utils/fetch";
import { log } from "../../utils/logger";
import type { ScheduleItem } from "@concourse/shared";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseIcs, type ParsedIcsEvent } from "./icsParser";
import { getPublicSourceBreaker } from "./publicSourceBreaker";

import { BFF_ENV } from "../../config/env";

export type FetchPublicScheduleResult = { schedule: ScheduleItem[]; degraded: boolean };

/** Finds a fixture from either supported test working directory before reading it. */
async function resolveFixturePath(filename: string): Promise<string> {
  // Tests may run from apps/bff or from the monorepo root.
  const candidates = [
    resolve(process.cwd(), "src/__fixtures__", filename),
    resolve(process.cwd(), "apps/bff/src/__fixtures__", filename),
  ];

  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // Continue with the next known test runner working directory.
    }
  }
  return candidates[0];
}

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

/** Fetches configured ICS sources independently and returns partial data when one fails. */
export async function fetchPublicSchedule(
  institution: InstitutionPack
): Promise<FetchPublicScheduleResult> {
  const sources = institution.publicSources?.schedules ?? [];
  const cacheKey = `public-schedule:${institution.id}`;
  const ttlMs = BFF_ENV.defaultCacheTtl * 1000;
  const mode = process.env.PUBLIC_EVENTS_MODE ?? "auto";

  return getCached(
    cacheKey,
    async (signal) => {
      // Mock mode is fixture-backed so schedule tests and demos do not depend
      // on external ICS availability.
      if (mode === "mock" && institution.id === "mockuni") {
        try {
          const fixturePath = await resolveFixturePath("mockuni-schedule.ics");
          const icsContent = await readFile(fixturePath, "utf-8");
          const parsed = parseIcs(icsContent, { rruleHorizonDays: BFF_ENV.rruleExpansionHorizonDays });
          return { schedule: parsed.map(toScheduleItem), degraded: false };
        } catch (err: unknown) {
          log("warn", "mock_schedule_load_failed", {
            reason: err instanceof Error ? err.message : String(err)
          });
          return { schedule: [], degraded: true };
        }
      }

      const results: ScheduleItem[] = [];
      let anyFailed = false;

      const settledSources = await Promise.allSettled(
        sources.map(async (source: { url: string }) => {
          const text = await getPublicSourceBreaker("public-schedule", source.url).call(() => fetchTextWithTimeout(source.url, { signal }));
          return parseIcs(text, { rruleHorizonDays: BFF_ENV.rruleExpansionHorizonDays });
        })
      );

      settledSources.forEach((result: PromiseSettledResult<ParsedIcsEvent[]>, index: number) => {
        if (result.status === "fulfilled") {
          results.push(...result.value.map(toScheduleItem));
        } else {
          anyFailed = true;
          log("warn", "public_schedule_source_failed", {
            sourceUrl: sources[index].url,
            reason: result.reason instanceof Error ? result.reason.message : String(result.reason)
          });
        }
      });

      // Partial source failures are represented as degraded data. Total source
      // failure should surface as an error instead of caching an empty schedule.
      if (settledSources.length > 0 && settledSources.every((result) => result.status === "rejected")) {
        throw new Error("All public schedule sources failed");
      }

      return { schedule: results, degraded: anyFailed };
    },
    ttlMs,
    { shouldCache: (result) => !result.degraded }
  );
}
