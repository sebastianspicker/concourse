import { describe, expect, it } from "vitest";
import { buildEventId } from "../eventId";

describe("buildEventId", () => {
  it("returns a deterministic ID for the same input", () => {
    const input = { sourceUrl: "https://example.com/events/1", title: "Concert", date: "2026-03-22" };
    const id1 = buildEventId(input);
    const id2 = buildEventId(input);
    expect(id1).toBe(id2);
  });

  it("starts with evt_ prefix", () => {
    const id = buildEventId({ sourceUrl: "https://x.com", title: "Test", date: "2026-01-01" });
    expect(id).toMatch(/^evt_[a-f0-9]{24}$/);
  });

  it("produces different IDs for different titles", () => {
    const base = { sourceUrl: "https://x.com", date: "2026-01-01" };
    const id1 = buildEventId({ ...base, title: "Concert A" });
    const id2 = buildEventId({ ...base, title: "Concert B" });
    expect(id1).not.toBe(id2);
  });

  it("produces different IDs for different dates", () => {
    const base = { sourceUrl: "https://x.com", title: "Concert" };
    const id1 = buildEventId({ ...base, date: "2026-01-01" });
    const id2 = buildEventId({ ...base, date: "2026-01-02" });
    expect(id1).not.toBe(id2);
  });

  it("trims whitespace from inputs", () => {
    const clean = buildEventId({ sourceUrl: "https://x.com", title: "Test", date: "2026-01-01" });
    const padded = buildEventId({ sourceUrl: " https://x.com ", title: " Test ", date: " 2026-01-01 " });
    expect(clean).toBe(padded);
  });
});
