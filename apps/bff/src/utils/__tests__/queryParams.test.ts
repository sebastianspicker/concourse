/** Verifies strict query-parameter parsing and validation. */

import { describe, expect, it } from "vitest";
import type { IncomingMessage } from "node:http";
import {
  parseQueryParams,
  getStringParam,
  getNumberParam,
  getDateParam,
  parseEventsFilter,
  parseRoomsFilter,
  parseScheduleFilter,
} from "../queryParams";

function mockReq(url: string): IncomingMessage {
  return { url, headers: { host: "localhost" } } as unknown as IncomingMessage;
}

describe("parseQueryParams", () => {
  it("parses query string from URL", () => {
    const params = parseQueryParams(mockReq("/events?search=concert&limit=10"));
    expect(params.get("search")).toBe("concert");
    expect(params.get("limit")).toBe("10");
  });

  it("returns empty params for missing URL", () => {
    const params = parseQueryParams({ url: undefined, headers: {} } as unknown as IncomingMessage);
    expect([...params.entries()]).toEqual([]);
  });

  it("handles URL with no query string", () => {
    const params = parseQueryParams(mockReq("/events"));
    expect(params.get("search")).toBeNull();
  });

  it("ignores a malformed host header while parsing the URL", () => {
    const params = parseQueryParams({
      url: "/events?search=concert",
      headers: { host: "bad host%%%" }
    } as unknown as IncomingMessage);
    expect(params.get("search")).toBe("concert");
  });
});

describe("getStringParam", () => {
  it("returns value when present", () => {
    const params = new URLSearchParams("key=value");
    expect(getStringParam(params, "key")).toBe("value");
  });

  it("returns default when absent", () => {
    const params = new URLSearchParams();
    expect(getStringParam(params, "key", "default")).toBe("default");
  });

  it("returns undefined when absent and no default", () => {
    const params = new URLSearchParams();
    expect(getStringParam(params, "key")).toBeUndefined();
  });
});

describe("getNumberParam", () => {
  it("parses valid number", () => {
    const params = new URLSearchParams("n=42");
    expect(getNumberParam(params, "n")).toBe(42);
  });

  it("returns default for NaN", () => {
    const params = new URLSearchParams("n=abc");
    expect(getNumberParam(params, "n", 10)).toBe(10);
  });

  it("parses float", () => {
    const params = new URLSearchParams("n=3.14");
    expect(getNumberParam(params, "n")).toBe(3.14);
  });

  it("returns default when absent", () => {
    const params = new URLSearchParams();
    expect(getNumberParam(params, "n", 5)).toBe(5);
  });
});

describe("getDateParam", () => {
  it("parses valid ISO date", () => {
    const params = new URLSearchParams("d=2026-03-22");
    const date = getDateParam(params, "d");
    expect(date).toBeInstanceOf(Date);
    expect(date?.toISOString()).toContain("2026-03-22");
  });

  it("returns undefined for invalid date", () => {
    const params = new URLSearchParams("d=not-a-date");
    expect(getDateParam(params, "d")).toBeUndefined();
  });

  it("returns undefined when absent", () => {
    const params = new URLSearchParams();
    expect(getDateParam(params, "d")).toBeUndefined();
  });
});

describe("parseEventsFilter", () => {
  it("rejects limit above 1000", () => {
    const params = new URLSearchParams("limit=9999");
    expect(() => parseEventsFilter(params)).toThrow("limit must be an integer between 1 and 1000");
  });

  it("rejects negative limit", () => {
    const params = new URLSearchParams("limit=-5");
    expect(() => parseEventsFilter(params)).toThrow("limit must be an integer between 1 and 1000");
  });

  it("truncates search to 200 chars", () => {
    const params = new URLSearchParams(`search=${"x".repeat(300)}`);
    expect(parseEventsFilter(params).search?.length).toBe(200);
  });

  it("clamps offset to >= 0", () => {
    const params = new URLSearchParams("offset=-10");
    expect(parseEventsFilter(params).offset).toBe(0);
  });

  it("rejects fractional limit", () => {
    const params = new URLSearchParams("limit=7.9");
    expect(() => parseEventsFilter(params)).toThrow("limit must be an integer between 1 and 1000");
  });
});

describe("parseRoomsFilter", () => {
  it("extracts campus filter", () => {
    const params = new URLSearchParams("campus=main");
    expect(parseRoomsFilter(params).campus).toBe("main");
  });

  it("truncates campus to 100 chars", () => {
    const params = new URLSearchParams(`campus=${"c".repeat(200)}`);
    expect(parseRoomsFilter(params).campus?.length).toBe(100);
  });
});

describe("parseScheduleFilter", () => {
  it("extracts campus filter as campusId", () => {
    const params = new URLSearchParams("campus=south");
    expect(parseScheduleFilter(params).campusId).toBe("south");
  });

  it("truncates campusId to 100 chars", () => {
    const params = new URLSearchParams(`campus=${"c".repeat(200)}`);
    expect(parseScheduleFilter(params).campusId?.length).toBe(100);
  });
});
