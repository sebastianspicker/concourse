/** Fetches, parses, caches, and degrades gracefully for public HfMT event sources. */

import type { InstitutionPack } from "../../config/loader";
import type { PublicEvent } from "@concourse/shared";
import { getCached } from "../../utils/cache";
import { fetchTextWithTimeout } from "../../utils/fetch";
import { log } from "../../utils/logger";
import { parseDateTimeInTimeZone } from "../../utils/timeZone";
import { buildEventId } from "./eventId";
import { getPublicSourceBreaker } from "./publicSourceBreaker";
import { BFF_ENV } from "../../config/env";
import mockuniEventsFixture from "../../__fixtures__/mockuni-events.json";

const DEFAULT_TIME_ZONE = "Europe/Berlin";
const MAX_EVENTS_PER_SOURCE = 8;
export type FetchPublicEventsResult = { events: PublicEvent[]; degraded: boolean };

function sourceLabelEvents(
  sources: Array<{ url: string; label: string }>,
  now: Date
): PublicEvent[] {
  return sources.map((source) => {
    const date = now.toISOString();
    return {
      id: buildEventId({ sourceUrl: source.url, title: source.label, date }),
      title: source.label,
      date,
      sourceUrl: source.url
    };
  });
}

/** Collects event sources independently so one failed upstream yields a degraded partial result. */
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
    async (signal): Promise<FetchPublicEventsResult> => {
      if (mode === "mock") {
        // Mock mode is deterministic for tests and demos; real deployments
        // should keep PUBLIC_EVENTS_MODE unset so public sources are fetched.
        if (institution.id === "mockuni") {
          const fixtureEvents = mockuniEventsFixture.events as PublicEvent[];
          return { events: fixtureEvents, degraded: false };
        }
        // Keep non-fixture mock institutions usable without fetching external sources.
        const mockEvents = sourceLabelEvents(sources, now);
        return { events: mockEvents, degraded: false };
      }

      let anyFailed = false;
      const timeZone = institution.timezone ?? DEFAULT_TIME_ZONE;
      const settledSources = await Promise.allSettled(
        sources.map(async (source: { url: string; label: string }) => {
          const html = await getPublicSourceBreaker("public-events", source.url).call(() => fetchTextWithTimeout(source.url, { signal }));
          return extractEventsFromHtml(html, source.url, timeZone);
        })
      );

      const parsedEvents: PublicEvent[] = [];
      settledSources.forEach((result: PromiseSettledResult<PublicEvent[]>, index: number) => {
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

      const fallbackEvents = sourceLabelEvents(sources, now);

      // Returning source labels is a degraded fallback: it keeps the app usable
      // during upstream HTML changes without pretending the data is fresh.
      const degradedResult: FetchPublicEventsResult = { events: fallbackEvents, degraded: true };
      return degradedResult;
    },
    ttlMs,
    { shouldCache: (result) => !result.degraded }
  );
}

/** Uses HfMT-specific markup first, then generic blocks when the page structure changes. */
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

/** Tries article blocks, then event tiles, then generic anchors as markup changes. */
function extractHfmtEvents(
  html: string,
  sourceUrl: string,
  timeZone: string,
): PublicEvent[] {
  // The public HfMT site has used multiple event-card shapes. Prefer explicit
  // article markup, then event tiles, then the generic link fallback.
  const articleEvents = extractEventsFromBlocks(
    html.match(/<article[\s\S]*?<\/article>/gi) ?? [],
    sourceUrl,
    timeZone
  );
  if (articleEvents.length > 0) return articleEvents;

  const tileEvents = extractEventsFromBlocks(
    html.match(/<div[^>]*class="[^"]*event[^"]*"[\s\S]*?<\/div>/gi) ?? [],
    sourceUrl,
    timeZone
  );
  if (tileEvents.length > 0) return tileEvents;

  return extractGenericEvents(html, sourceUrl);
}

function extractEventsFromBlocks(
  blocks: string[],
  sourceUrl: string,
  timeZone: string
): PublicEvent[] {
  const events: PublicEvent[] = [];
  for (const block of blocks) {
    const event = extractEventFromBlock(block, sourceUrl, timeZone);
    if (!event) continue;

    events.push(event);
    if (events.length >= MAX_EVENTS_PER_SOURCE) break;
  }
  return events;
}

/** Builds one public event from a title and link, using the epoch when no date is parseable. */
function extractEventFromBlock(
  block: string,
  sourceUrl: string,
  timeZone: string
): PublicEvent | null {
  const title = extractTitle(block);
  const url = extractHref(block, sourceUrl);
  if (!title || title.length > 200 || !url) {
    return null;
  }

  const date = extractDate(block, timeZone) ?? "1970-01-01T00:00:00.000Z";
  return {
    id: buildEventId({ sourceUrl: url, title, date }),
    title,
    date,
    sourceUrl: url
  };
}

/** Extracts generic anchor links for sources that do not expose HfMT event-card markup. */
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

const HTML_DATETIME_PATTERN = /datetime="([^"]+)"/i;
const GERMAN_DATE_TIME_PATTERN = /(\d{2})\.(\d{2})\.(\d{4})\s*(\d{2}):(\d{2})/;
const GERMAN_DATE_PATTERN = /(\d{2})\.(\d{2})\.(\d{4})/;

function parseHtmlDateTime(value: string): string | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

/** Parses German textual dates in the institution time zone rather than server local time. */
function parseGermanDate(block: string, timeZone: string): string | null {
  const dateTimeMatch = block.match(GERMAN_DATE_TIME_PATTERN);
  if (dateTimeMatch) {
    return parseMatchedGermanDate(dateTimeMatch, timeZone);
  }

  const dateMatch = block.match(GERMAN_DATE_PATTERN);
  return dateMatch ? parseMatchedGermanDate(dateMatch, timeZone) : null;
}

function parseMatchedGermanDate(match: RegExpMatchArray, timeZone: string): string {
  return parseDateTimeInTimeZone(
    {
      year: Number(match[3]),
      month: Number(match[2]),
      day: Number(match[1]),
      hour: Number(match[4] ?? 0),
      minute: Number(match[5] ?? 0),
      second: 0
    },
    timeZone
  );
}

/** Prefers machine-readable datetime attributes before parsing locale-dependent page text. */
function extractDate(block: string, timeZone: string): string | null {
  const datetimeMatch = block.match(HTML_DATETIME_PATTERN);
  if (datetimeMatch) {
    const parsed = parseHtmlDateTime(datetimeMatch[1]);
    if (parsed) {
      return parsed;
    }
  }

  return parseGermanDate(block, timeZone);
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

/** Resolves relative links but rejects malformed hrefs instead of aborting the source parse. */
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
