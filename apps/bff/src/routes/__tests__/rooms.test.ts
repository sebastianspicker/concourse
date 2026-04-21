import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleRooms } from "../rooms";
import institution from "../../__fixtures__/institution.public.json";
import roomsFixture from "../../__fixtures__/rooms.json";

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

describe("GET /rooms", () => {
  it("returns public rooms from the institution pack", async () => {
    const { response, getBody, getStatus } = createMockResponse();

    await handleRooms({} as IncomingMessage, response, institution);

    expect(getStatus()).toBe(200);
    expect(JSON.parse(getBody() ?? "{}")).toEqual(roomsFixture);
  });
});

