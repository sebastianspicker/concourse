import type { InstitutionPack } from "../../config/loader";
import type { PublicEvent } from "@campus/shared";
import { getCached } from "../../utils/cache";
import { createCircuitBreaker, type CircuitBreaker } from "../../utils/circuitBreaker";
import { fetchTextWithTimeout } from "../../utils/fetch";
import { log } from "../../utils/logger";
import { parseDateTimeInTimeZone } from "../../utils/timeZone";
import { buildEventId } from "./eventId";
import { BFF_ENV } from "../../config/env";

const DEFAULT_TIME_ZONE = "Europe/Berlin";
const MAX_EVENTS_PER_SOURCE = 8;
const eventsBreakers = new Map<string, CircuitBreaker>();

function getEventsBreaker(sourceUrl: string): CircuitBreaker {
  const existing = eventsBreakers.get(sourceUrl);
  if (existing) {
    return existing;
  }

  const breaker = createCircuitBreaker({
    name: `public-events:${sourceUrl}`,
    failureThreshold: 5,
    cooldownMs: 30_000,
  });
  eventsBreakers.set(sourceUrl, breaker);
  return breaker;
}

// Import mock fixtures for mock mode
import mockuniEventsFixture from "../../__fixtures__/mockuni-events.json";

export type FetchPublicEventsResult = { events: PublicEvent[]; degraded: boolean };

export async function fetchPublicEvents(
  institution: InstitutionPack
): Promise<FetchPublicEventsResult> {
  const sources = institution.publicSources?.events ?? [];
  const envDate = process.env.PUBLIC_EVENTS_DATE;
  let now = envDate ? new Date(envDate) : new Date();
  if (Number.isNaN(now.getTime())) now = new Date();
  const cacheKey = `public-events:${institution.id}`;
  const ttlMs = BFF_ENV.defaultCacheTtl * 1000;
  const mode = process.env.PUBLIC_EVENTS_MODE ?? "auto";

  return getCached(
    cacheKey,
    async (): Promise<FetchPublicEventsResult> => {
      if (mode === "mock") {
        // Use institution-specific fixture if available
        if (institution.id === "mockuni") {
          const fixtureEvents = mockuniEventsFixture.events as PublicEvent[];
          return { events: fixtureEvents, degraded: false };
        }
        // Fallback: create basic mock events from source labels
        const mockEvents = sources.map((source: { url: string; label: string }) => {
          const date = now.toISOString();
          return {
            id: buildEventId({ sourceUrl: source.url, title: source.label, date }),
            title: source.label,
            date,
            sourceUrl: source.url
          };
        });
        return { events: mockEvents, degraded: false };
      }

      let anyFailed = false;
      const timeZone = institution.timezone ?? DEFAULT_TIME_ZONE;
      const settlement = await Promise.allSettled(
        sources.map(async (source: { url: string; label: string }) => {
          const html = await getEventsBreaker(source.url).call(() => fetchTextWithTimeout(source.url));
          return extractEventsFromHtml(html, source.url, timeZone);
        })
      );

      const parsedEvents: PublicEvent[] = [];
      settlement.forEach((result: PromiseSettledResult<PublicEvent[]>, index: number) => {
        if (result.status === "fulfilled") {
          parsedEvents.push(...result.value);
        } else {
          anyFailed = true;
          log("warn", "public_events_source_failed", {
            sourceUrl: sources[index].url,
            reason: result.reason instanceof Error ? result.reason.message : String(result.reason)
          });
        }
      });

      const deduped = dedupeAndSortEvents(parsedEvents);
      if (deduped.length > 0) {
        return { events: deduped.slice(0, MAX_EVENTS_PER_SOURCE), degraded: anyFailed };
      }

      const fallbackEvents = sources.map((source: { url: string; label: string }) => {
        const date = now.toISOString();
        return {
          id: buildEventId({ sourceUrl: source.url, title: source.label, date }),
          title: source.label,
          date,
          sourceUrl: source.url
        };
      });

      const degradedResult: FetchPublicEventsResult = { events: fallbackEvents, degraded: true };
      return degradedResult;
    },
    ttlMs,
    { shouldCache: (result) => !result.degraded }
  );
}

function extractEventsFromHtml(
  html: string,
  sourceUrl: string,
  timeZone: string,
): PublicEvent[] {
  if (sourceUrl.includes("hfmt-koeln.de")) {
    return extractHfmtEvents(html, sourceUrl, timeZone);
  }

  return extractGenericEvents(html, sourceUrl);
}

function extractHfmtEvents(
  html: string,
  sourceUrl: string,
  timeZone: string,
): PublicEvent[] {
  const events: PublicEvent[] = [];
  const blocks = html.match(/<article[\s\S]*?<\/article>/gi) ?? [];

  for (const block of blocks) {
    const title = extractTitle(block);
    if (!title || title.length > 200) { // Limit title length to avoid extreme cases
      continue;
    }

    const date = extractDate(block, timeZone) ?? "1970-01-01T00:00:00.000Z";
    const url = extractHref(block, sourceUrl);

    if (!url) {
      continue;
    }

    events.push({
      id: buildEventId({ sourceUrl: url, title, date }),
      title,
      date,
      sourceUrl: url
    });

    if (events.length >= MAX_EVENTS_PER_SOURCE) {
      break;
    }
  }

  if (events.length > 0) {
    return events;
  }

  const tiles =
    html.match(/<div[^>]*class="[^"]*event[^"]*"[\s\S]*?<\/div>/gi) ?? [];
  for (const block of tiles) {
    const title = extractTitle(block);
    const date = extractDate(block, timeZone) ?? "1970-01-01T00:00:00.000Z";
    const url = extractHref(block, sourceUrl);

    if (!title || !url) {
      continue;
    }

    events.push({
      id: buildEventId({ sourceUrl: url, title, date }),
      title,
      date,
      sourceUrl: url
    });

    if (events.length >= MAX_EVENTS_PER_SOURCE) {
      break;
    }
  }

  if (events.length > 0) {
    return events;
  }

  return extractGenericEvents(html, sourceUrl);
}

function extractGenericEvents(
  html: string,
  sourceUrl: string
): PublicEvent[] {
  const events: PublicEvent[] = [];
  const anchorRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const rawTitle = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (rawTitle.length < 4 || rawTitle.length > 120) {
      continue;
    }

    const date = "1970-01-01T00:00:00.000Z";
    const resolvedUrl = safeResolveUrl(href, sourceUrl);

    if (!resolvedUrl) {
      continue;
    }

    events.push({
      id: buildEventId({ sourceUrl: resolvedUrl, title: rawTitle, date }),
      title: rawTitle,
      date,
      sourceUrl: resolvedUrl
    });

    if (events.length >= MAX_EVENTS_PER_SOURCE) {
      break;
    }
  }

  return events;
}

function dedupeAndSortEvents(events: PublicEvent[]): PublicEvent[] {
  const byId = new Map<string, PublicEvent>();
  for (const e of events) {
    byId.set(e.id, e);
  }

  return [...byId.values()].sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return a.id.localeCompare(b.id);
  });
}

function extractTitle(block: string): string | null {
  const dataTitleMatch = block.match(/data-event-title="([^"]+)"/i);
  if (dataTitleMatch) {
    const cleaned = dataTitleMatch[1].trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  const headingMatch = block.match(/<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/i);
  if (headingMatch) {
    const cleaned = headingMatch[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  const anchorTextMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
  if (anchorTextMatch) {
    const cleaned = anchorTextMatch[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  return null;
}

function extractDate(block: string, timeZone: string): string | null {
  const datetimeMatch = block.match(/datetime="([^"]+)"/i);
  if (datetimeMatch) {
    const parsed = new Date(datetimeMatch[1]);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString();
    }
  }

  const dateTimeMatch =
    block.match(/(\d{2})\.(\d{2})\.(\d{4})\s*(\d{2}):(\d{2})/);
  if (dateTimeMatch) {
    return parseDateTimeInTimeZone(
      {
        year: Number(dateTimeMatch[3]),
        month: Number(dateTimeMatch[2]),
        day: Number(dateTimeMatch[1]),
        hour: Number(dateTimeMatch[4]),
        minute: Number(dateTimeMatch[5]),
        second: 0
      },
      timeZone
    );
  }

  const dateMatch = block.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    return parseDateTimeInTimeZone(
      {
        year: Number(dateMatch[3]),
        month: Number(dateMatch[2]),
        day: Number(dateMatch[1]),
        hour: 0,
        minute: 0,
        second: 0
      },
      timeZone
    );
  }

  return null;
}

function extractHref(block: string, sourceUrl: string): string | null {
  const dataUrlMatch = block.match(/data-event-url="([^"]+)"/i);
  if (dataUrlMatch) {
    return safeResolveUrl(dataUrlMatch[1], sourceUrl);
  }

  const hrefMatch = block.match(/href="([^"]+)"/i);
  if (!hrefMatch) {
    return null;
  }

  return safeResolveUrl(hrefMatch[1], sourceUrl);
}

function safeResolveUrl(href: string, sourceUrl: string): string | null {
  try {
    const url = new URL(href, sourceUrl);
    // Only allow http/https protocols. Rejects javascript:, data:, etc.
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    // Safety check: prevent extreme URL lengths
    if (url.toString().length > 2048) return null;

    return url.toString();
  } catch {
    return null;
  }
}
