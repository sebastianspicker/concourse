/** Verifies bounded text fetching, timeout, and response-size failures. */

import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage } from "node:http";
import type { RequestOptions } from "node:https";
import { describe, expect, it, vi } from "vitest";

import { createFetchTextWithTimeout, TimeoutError } from "./fetch";

type LookupResult = { address: string; family: number };
type RequestCall = { url: URL; options: RequestOptions };

class FakeRequest extends EventEmitter {
  end = vi.fn();
  destroy = vi.fn();
}

type FakeResponse = IncomingMessage & { start: () => void };

function response(statusCode = 200, headers: IncomingMessage["headers"] = {}, chunks: Array<string | Buffer> = ["ok"]): FakeResponse {
  const result = new EventEmitter() as FakeResponse;
  result.statusCode = statusCode;
  result.headers = headers;
  result.destroy = vi.fn();
  // IncomingMessage buffers data until consumers attach listeners. Use the
  // next event-loop turn so this EventEmitter fake preserves that contract
  // across the address-selection promise boundary.
  result.start = () => setImmediate(() => {
    for (const chunk of chunks) result.emit("data", chunk);
    result.emit("end");
  });
  return result;
}

function stalledResponse(): FakeResponse {
  const result = new EventEmitter() as FakeResponse;
  result.statusCode = 200;
  result.headers = {};
  result.destroy = vi.fn();
  result.start = vi.fn();
  return result;
}

function makeFetcher({
  lookups = [[{ address: "93.184.216.34", family: 4 }]],
  responses = [response()],
  requestErrors = [],
  onRequest
}: {
  lookups?: LookupResult[][];
  responses?: FakeResponse[];
  requestErrors?: Array<Error | undefined>;
  onRequest?: (request: FakeRequest) => void;
} = {}) {
  const calls: RequestCall[] = [];
  let lookupIndex = 0;
  let requestIndex = 0;
  let responseIndex = 0;
  const lookup = vi.fn(async () => lookups[Math.min(lookupIndex++, lookups.length - 1)] ?? []);
  const request = vi.fn((url: URL, options: RequestOptions, callback: (incoming: IncomingMessage) => void) => {
    calls.push({ url, options });
    const fake = new FakeRequest();
    fake.once("error", () => undefined);
    onRequest?.(fake);
    const requestError = requestErrors[requestIndex++];
    if (requestError) {
      queueMicrotask(() => fake.emit("error", requestError));
      return fake as unknown as ClientRequest;
    }
    const next = responses[responseIndex++];
    if (next) queueMicrotask(() => { callback(next); next.start(); });
    return fake as unknown as ClientRequest;
  });
  return { calls, fetchText: createFetchTextWithTimeout({ lookup, httpRequest: request, httpsRequest: request }), lookup, request };
}

function runPinnedLookup(lookup: NonNullable<RequestOptions["lookup"]>, hostname: string): Promise<{ address: string; family: number }> {
  return new Promise((resolve, reject) => {
    lookup(hostname, { family: 4 }, (error, address, family) => {
      if (error) {
        reject(error);
        return;
      }
      if (typeof address !== "string" || family === undefined) {
        reject(new Error("Pinned lookup returned an unexpected result shape"));
        return;
      }
      resolve({ address, family });
    });
  });
}

describe("fetchTextWithTimeout", () => {
  it("pins the connection lookup to validated DNS results even if resolution would later flip", async () => {
    const { calls, fetchText } = makeFetcher();
    await expect(fetchText("https://public.example:8443/path?q=1")).resolves.toBe("ok");
    const callback = calls[0]?.options.lookup;
    if (!callback) throw new Error("Expected a pinned lookup callback");
    const pinned = await runPinnedLookup(callback, "public.example");
    expect(pinned).toEqual({ address: "93.184.216.34", family: 4 });
    expect(calls[0]?.options).toMatchObject({ agent: false, family: 4, method: "GET", hostname: "public.example", port: "8443", servername: "public.example" });
    expect(calls[0]?.options.headers).toMatchObject({ Host: "public.example:8443", "Accept-Encoding": "identity" });
    await expect(runPinnedLookup(callback, "attacker.example")).rejects.toMatchObject({ code: "ENOTFOUND" });
  });

  it("rejects mixed DNS answers before creating a request", async () => {
    const { fetchText, request } = makeFetcher({ lookups: [[{ address: "93.184.216.34", family: 4 }, { address: "127.0.0.1", family: 4 }]] });
    await expect(fetchText("https://public.example")).rejects.toThrow("Fetch URL must target a public host");
    expect(request).not.toHaveBeenCalled();
  });

  it("tries the next validated address when the first connection fails", async () => {
    const firstAddress = "2606:2800:220:1:248:1893:25c8:1946";
    const secondAddress = "93.184.216.34";
    const fetcher = makeFetcher({
      lookups: [[{ address: firstAddress, family: 6 }, { address: secondAddress, family: 4 }]],
      requestErrors: [new Error("Network unreachable")],
      responses: [response(200, {}, ["recovered"])]
    });

    await expect(fetcher.fetchText("https://public.example")).resolves.toBe("recovered");
    expect(fetcher.request).toHaveBeenCalledTimes(2);
    expect(fetcher.calls.map((call) => call.options.family)).toEqual([6, 4]);
    await expect(runPinnedLookup(fetcher.calls[1]!.options.lookup!, "public.example")).resolves.toEqual({
      address: secondAddress,
      family: 4
    });
  });

  it("validates redirect targets, missing locations, and the three-redirect limit", async () => {
    const privateRedirect = makeFetcher({ responses: [response(302, { location: "http://127.0.0.1" })] });
    await expect(privateRedirect.fetchText("https://public.example")).rejects.toThrow("Fetch URL must target a public host");
    const missingLocation = makeFetcher({ responses: [response(302)] });
    await expect(missingLocation.fetchText("https://public.example")).rejects.toThrow("Redirect response missing Location header");
    const redirects = makeFetcher({ responses: [response(302, { location: "/a" }), response(302, { location: "/b" }), response(302, { location: "/c" }), response(302, { location: "/d" })] });
    await expect(redirects.fetchText("https://public.example")).rejects.toThrow("Fetch URL exceeded 3 redirects");
    expect(redirects.request).toHaveBeenCalledTimes(4);
  });

  it("resolves and pins every relative redirect hop independently", async () => {
    const redirects = makeFetcher({
      lookups: [[{ address: "93.184.216.34", family: 4 }], [{ address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }]],
      responses: [response(302, { location: "/final" }), response(200, {}, ["done"])]
    });
    await expect(redirects.fetchText("https://public.example/start")).resolves.toBe("done");
    expect(redirects.lookup).toHaveBeenNthCalledWith(1, "public.example", { all: true, verbatim: true });
    expect(redirects.lookup).toHaveBeenNthCalledWith(2, "public.example", { all: true, verbatim: true });
    expect(redirects.calls[1]?.options).toMatchObject({ family: 6, hostname: "public.example" });
  });

  it("distinguishes its deadline from caller aborts", async () => {
    const stalledLookup = vi.fn(() => new Promise<LookupResult[]>(() => undefined));
    const dnsTimeout = createFetchTextWithTimeout({ lookup: stalledLookup });
    await expect(dnsTimeout("https://public.example", undefined, 5)).rejects.toBeInstanceOf(TimeoutError);

    const waitingForHeaders = makeFetcher({ responses: [] });
    await expect(waitingForHeaders.fetchText("https://public.example", undefined, 5)).rejects.toBeInstanceOf(TimeoutError);
    const waitingForBody = makeFetcher({ responses: [stalledResponse()] });
    await expect(waitingForBody.fetchText("https://public.example", undefined, 5)).rejects.toBeInstanceOf(TimeoutError);
    const controller = new AbortController();
    const aborted = makeFetcher({ responses: [], onRequest: () => queueMicrotask(() => controller.abort()) });
    await expect(aborted.fetchText("https://public.example", { signal: controller.signal }, 10_000)).rejects.not.toBeInstanceOf(TimeoutError);
    expect(aborted.request).toHaveBeenCalledTimes(1);
  });

  it("rejects compressed, declared-too-large, and oversized chunked responses", async () => {
    const compressedResponse = response(200, { "content-encoding": "gzip" });
    const compressed = makeFetcher({ responses: [compressedResponse] });
    await expect(compressed.fetchText("https://public.example")).rejects.toThrow("Unexpected response Content-Encoding");
    const declaredResponse = response(200, { "content-length": String(10 * 1024 * 1024 + 1) });
    const declared = makeFetcher({ responses: [declaredResponse] });
    await expect(declared.fetchText("https://public.example")).rejects.toThrow("Response too large");
    const chunkedResponse = response(200, {}, [Buffer.alloc(10 * 1024 * 1024 + 1)]);
    const chunked = makeFetcher({ responses: [chunkedResponse] });
    await expect(chunked.fetchText("https://public.example")).rejects.toThrow("Response body exceeds");
    expect(compressedResponse.destroy).toHaveBeenCalled();
    expect(declaredResponse.destroy).toHaveBeenCalled();
    expect(chunkedResponse.destroy).toHaveBeenCalled();
  });

  it("destroys rejected responses without buffering their bodies", async () => {
    const httpError = response(503, {}, ["ignored"]);
    const invalidLength = response(200, { "content-length": "not-a-number" });
    const fetcher = makeFetcher({ responses: [httpError, invalidLength] });
    await expect(fetcher.fetchText("https://public.example/error")).rejects.toThrow("HTTP 503");
    await expect(fetcher.fetchText("https://public.example/length")).rejects.toThrow("Invalid response Content-Length");
    expect(httpError.destroy).toHaveBeenCalled();
    expect(invalidLength.destroy).toHaveBeenCalled();
  });

  it.each([
    "file:///tmp/x", "ftp://public.example", "https://user:pass@public.example", "http://127.0.0.1", "http://192.0.2.1", "http://224.0.0.1", "http://[::1]", "http://[::ffff:127.0.0.1]", "http://[2001:db8::1]", "http://[fd00::1]", "http://[fe80::1]"
  ])("rejects disallowed URL %s", async (url) => {
    const { fetchText, request } = makeFetcher();
    await expect(fetchText(url)).rejects.toThrow();
    expect(request).not.toHaveBeenCalled();
  });
});
