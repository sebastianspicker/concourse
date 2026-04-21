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
  const candidates = [
    resolve(process.cwd(), "src/__fixtures__", filename),
    resolve(process.cwd(), "apps/bff/src/__fixtures__", filename),
  ];

  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // try next candidate
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
): Promise<ScheduleItem[]> {
  const sources = institution.publicSources?.schedules ?? [];
  const cacheKey = `public-schedule:${institution.id}`;
  const ttlMs = BFF_ENV.defaultCacheTtl * 1000;
  const mode = process.env.PUBLIC_EVENTS_MODE ?? "auto";

  return getCached(
    cacheKey,
    async () => {
      // Mock mode: load from fixture file for mockuni
      if (mode === "mock" && institution.id === "mockuni") {
        try {
          const fixturePath = await resolveFixturePath("mockuni-schedule.ics");
          const icsContent = await readFile(fixturePath, "utf-8");
          const parsed = parseIcs(icsContent, { rruleHorizonDays: BFF_ENV.rruleExpansionHorizonDays });
          return parsed.map(toScheduleItem);
        } catch (err: unknown) {
          log("warn", "mock_schedule_load_failed", {
            reason: err instanceof Error ? err.message : String(err)
          });
          return [];
        }
      }

      const results: ScheduleItem[] = [];

      const settlement = await Promise.allSettled(
        sources.map(async (source: { url: string }) => {
          const text = await getScheduleBreaker(source.url).call(() => fetchTextWithTimeout(source.url));
          return parseIcs(text, { rruleHorizonDays: BFF_ENV.rruleExpansionHorizonDays });
        })
      );

      settlement.forEach((result: PromiseSettledResult<ParsedIcsEvent[]>, index: number) => {
        if (result.status === "fulfilled") {
          results.push(...result.value.map(toScheduleItem));
        } else {
          log("warn", "public_schedule_source_failed", {
            sourceUrl: sources[index].url,
            reason: result.reason instanceof Error ? result.reason.message : String(result.reason)
          });
        }
      });

      return results;
    },
    ttlMs
  );
}
