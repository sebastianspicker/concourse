import { createHash } from "node:crypto";

type EventIdInput = {
  sourceUrl: string;
  title: string;
  date: string;
};

/**
 * Builds a stable event ID from source URL, title, and date.
 * Use the date extracted from the page when available; if the caller passes
 * a server-time fallback (e.g. when the page has no date), the ID may change
 * across requests until the source provides a stable date.
 */
export function buildEventId(input: EventIdInput): string {
  const normalized = JSON.stringify({
    sourceUrl: input.sourceUrl.trim(),
    title: input.title.trim(),
    date: input.date.trim()
  });

  const hash = createHash("sha256").update(normalized).digest("hex").slice(0, 24);
  return `evt_${hash}`;
}
