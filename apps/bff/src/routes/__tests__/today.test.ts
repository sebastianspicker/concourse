import { beforeEach, describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleToday } from "../today";
import institution from "../../__fixtures__/institution.public.json";
import todayFixture from "../../__fixtures__/today.json";
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

describe("GET /today", () => {
  beforeEach(() => {
    process.env.PUBLIC_EVENTS_DATE = "2020-01-01T00:00:00.000Z";
    process.env.PUBLIC_EVENTS_MODE = "mock";
    clearCache();
  });

  it("returns a public today payload", async () => {
    const { response, getBody, getStatus } = createMockResponse();

    await handleToday({} as IncomingMessage, response, institution);

    expect(getStatus()).toBe(200);
    expect(JSON.parse(getBody() ?? "{}")).toEqual(todayFixture);
  });
});
