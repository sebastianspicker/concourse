import type { InstitutionPack } from "../../config/loader";
import { getCached } from "../../utils/cache";
import { createCircuitBreaker, type CircuitBreaker } from "../../utils/circuitBreaker";
import { fetchTextWithTimeout } from "../../utils/fetch";
import { log } from "../../utils/logger";
import type { ScheduleItem } from "@campus/shared";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseIcs, type ParsedIcsEvent } from "./icsParser";

import { BFF_ENV } from "../../config/env";

export type FetchPublicScheduleResult = { schedule: ScheduleItem[]; degraded: boolean };

const scheduleBreakers = new Map<string, CircuitBreaker>();

function getScheduleBreaker(sourceUrl: string): CircuitBreaker {
  const existing = scheduleBreakers.get(sourceUrl);
  if (existing) {
    return existing;
  }

  const breaker = createCircuitBreaker({
    name: `public-schedule:${sourceUrl}`,
    failureThreshold: 5,
    cooldownMs: 30_000,
  });
  scheduleBreakers.set(sourceUrl, breaker);
  return breaker;
}

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

export async function fetchPublicSchedule(
  institution: InstitutionPack
): Promise<FetchPublicScheduleResult> {
  const sources = institution.publicSources?.schedules ?? [];
  const cacheKey = `public-schedule:${institution.id}`;
  const ttlMs = BFF_ENV.defaultCacheTtl * 1000;
  const mode = process.env.PUBLIC_EVENTS_MODE ?? "auto";

  return getCached(
    cacheKey,
    async () => {
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
          const text = await getScheduleBreaker(source.url).call(() => fetchTextWithTimeout(source.url));
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
