import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage } from "node:http";
import { PassThrough } from "node:stream";
import type { RequestOptions } from "node:https";
import { describe, expect, it, vi } from "vitest";

import { createFetchTextWithTimeout, type FetchTextDependencies } from "./httpClient";
import { log } from "./logger";

type PlannedResponse = { body?: string; headers?: IncomingMessage["headers"]; statusCode: number };

function fakeRequest(
  plans: PlannedResponse[],
  captured: RequestOptions[]
): NonNullable<FetchTextDependencies["httpRequest"]> {
  return ((_url, options, callback) => {
    captured.push(options);
    const client = new EventEmitter() as ClientRequest;
    client.destroy = () => client;
    client.end = () => {
      const plan = plans.shift();
      if (!plan) throw new Error("unexpected upstream request");
      const stream = new PassThrough();
      const response = stream as unknown as IncomingMessage;
      response.statusCode = plan.statusCode;
      response.headers = plan.headers ?? {};
      callback(response);
      queueMicrotask(() => stream.end(plan.body ?? ""));
      return client;
    };
    return client;
  }) as NonNullable<FetchTextDependencies["httpRequest"]>;
}

describe("upstream and logging security contracts", () => {
  it("rejects mixed DNS answers and revalidates a redirect before a second request", async () => {
    let requestCount = 0;
    const mixedFetch = createFetchTextWithTimeout({
      lookup: async () => [
        { address: "8.8.8.8", family: 4 },
        { address: "127.0.0.1", family: 4 }
      ],
      httpRequest: (() => {
        requestCount += 1;
        throw new Error("request must not start");
      }) as NonNullable<FetchTextDependencies["httpRequest"]>
    });
    await expect(mixedFetch("http://public.example.test/events")).rejects.toThrow("public host");
    expect(requestCount).toBe(0);

    const captured: RequestOptions[] = [];
    const redirectedFetch = createFetchTextWithTimeout({
      lookup: async (hostname) => hostname === "public.example.test"
        ? [{ address: "8.8.8.8", family: 4 }]
        : [{ address: "10.0.0.2", family: 4 }],
      httpRequest: fakeRequest([
        { statusCode: 302, headers: { location: "http://internal.example.test/private" } }
      ], captured)
    });
    await expect(redirectedFetch("http://public.example.test/events")).rejects.toThrow("public host");
    expect(captured).toHaveLength(1);
    expect(captured[0]?.hostname).toBe("public.example.test");
  });

  it("pins the validated address and recursively removes secrets from cyclic logs", async () => {
    const captured: RequestOptions[] = [];
    const fetchText = createFetchTextWithTimeout({
      lookup: async () => [{ address: "8.8.8.8", family: 4 }],
      httpRequest: fakeRequest([{ statusCode: 200, body: "public" }], captured)
    });
    await expect(fetchText("http://public.example.test/events")).resolves.toBe("public");

    const pinned = captured[0]?.lookup;
    expect(pinned).toBeTypeOf("function");
    await new Promise<void>((resolve, reject) => {
      pinned?.("public.example.test", {}, (error, address, family) => {
        if (error) reject(error);
        else {
          expect(address).toBe("8.8.8.8");
          expect(family).toBe(4);
          resolve();
        }
      });
    });

    const context: Record<string, unknown> = {
      nested: [{ ToKeN: "secret", safe: "visible" }],
      Authorization: "Bearer secret"
    };
    context.self = context;
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    log("info", "contract", context);
    const payload = JSON.parse(String(consoleLog.mock.calls[0]?.[0])) as Record<string, unknown>;
    consoleLog.mockRestore();

    expect(JSON.stringify(payload)).not.toContain("secret");
    expect(payload.context).toEqual({
      nested: [{ safe: "visible" }],
      self: { nested: [{ safe: "visible" }], self: "[Circular]" }
    });
  });
});
