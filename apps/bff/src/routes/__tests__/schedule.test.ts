import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { handleSchedule } from "../schedule";
import institution from "../../__fixtures__/institution.public.json";
import scheduleFixture from "../../__fixtures__/schedule.json";
import { clearCache } from "../../utils/cache";

function createMockResponse(): {
  response: ServerResponse;
  getBody: () => string | undefined;
  getStatus: () => number | undefined;
} {
  let body: string | undefined;
  let status: number | undefined;

  const response = {
    setHeader() {
      return undefined;
    },
    writeHead(code: number) {
      status = code;
      return response;
    },
    end(chunk?: string) {
      body = chunk;
    }
  } as unknown as ServerResponse;

  return {
    response,
    getBody: () => body,
    getStatus: () => status
  };
}

describe("GET /schedule", () => {
  beforeEach(() => {
    clearCache();
    const ics = readFileSync(
      new URL("../../__fixtures__/schedule.ics", import.meta.url),
      "utf8"
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: null,
      text: async () => ics
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed schedule", async () => {
    const { response, getBody, getStatus } = createMockResponse();

    await handleSchedule({} as IncomingMessage, response, institution);

    expect(getStatus()).toBe(200);
    expect(JSON.parse(getBody() ?? "{}")).toEqual(scheduleFixture);
  });

  it("includes _total equal to schedule array length", async () => {
    const { response, getBody } = createMockResponse();

    await handleSchedule({} as IncomingMessage, response, institution);

    const body = JSON.parse(getBody() ?? "{}");
    expect(body._total).toBe(body.schedule.length);
  });
});
