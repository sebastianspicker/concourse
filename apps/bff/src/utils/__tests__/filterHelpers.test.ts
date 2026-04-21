import { describe, it, expect } from "vitest";
import { applySearch, applyDateRange, applyPagination } from "../filterHelpers";

const items = [
  { id: "1", title: "Alpha Event", date: "2026-01-10T10:00:00Z" },
  { id: "2", title: "Beta Meeting", date: "2026-02-15T14:00:00Z" },
  { id: "3", title: "Alpha Workshop", date: "2026-03-20T09:00:00Z" },
  { id: "4", title: "Gamma Talk", date: "2026-04-05T16:00:00Z" },
];

describe("applySearch", () => {
  it("returns all items when search is undefined", () => {
    expect(applySearch(items, undefined, (i) => i.title)).toEqual(items);
  });

  it("filters by case-insensitive partial match", () => {
    const result = applySearch(items, "alpha", (i) => i.title);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(applySearch(items, "zzz", (i) => i.title)).toEqual([]);
  });

  it("returns all items when search is empty string", () => {
    expect(applySearch(items, "", (i) => i.title)).toEqual(items);
  });
});

describe("applyDateRange", () => {
  it("returns all items when both dates are undefined", () => {
    expect(applyDateRange(items, undefined, undefined, (i) => i.date)).toEqual(items);
  });

  it("filters by fromDate", () => {
    const result = applyDateRange(items, new Date("2026-03-01"), undefined, (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(["3", "4"]);
  });

  it("filters by toDate", () => {
    const result = applyDateRange(items, undefined, new Date("2026-02-28"), (i) => i.date);
    expect(result.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("filters by both fromDate and toDate", () => {
    const result = applyDateRange(
      items,
      new Date("2026-02-01"),
      new Date("2026-03-31"),
      (i) => i.date
    );
    expect(result.map((i) => i.id)).toEqual(["2", "3"]);
  });
});

describe("applyPagination", () => {
  it("returns all items when offset is 0 and limit is undefined", () => {
    expect(applyPagination(items, 0, undefined)).toEqual(items);
  });

  it("applies limit", () => {
    expect(applyPagination(items, 0, 2)).toHaveLength(2);
    expect(applyPagination(items, 0, 2).map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("applies offset", () => {
    expect(applyPagination(items, 2, undefined).map((i) => i.id)).toEqual(["3", "4"]);
  });

  it("applies offset and limit together", () => {
    expect(applyPagination(items, 1, 2).map((i) => i.id)).toEqual(["2", "3"]);
  });

  it("returns empty when offset exceeds length", () => {
    expect(applyPagination(items, 10, undefined)).toEqual([]);
  });
});
