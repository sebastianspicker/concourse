#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const serverEntry = join(repoRoot, "apps/bff/dist/server.js");
const startupTimeoutMs = 10_000;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function reservePort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  assert(address && typeof address === "object", "Could not reserve a local E2E port");
  return address.port;
}

function readLoopbackResponse(port, path) {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port, path }, (response) => {
      let responseText = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { responseText += chunk; });
      response.on("end", () => resolve({ incoming: response, text: responseText }));
    });
    request.on("error", reject);
  });
}

function parseJsonBody(text, path) {
  let body;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch (err) {
    throw new Error(`Expected JSON from ${path}, got: ${text.slice(0, 200)}`, { cause: err });
  }
  return body;
}

function toResponse(incoming) {
  return {
    status: incoming.statusCode ?? 0,
    headers: {
      get(name) {
        const value = incoming.headers[name.toLowerCase()];
        return Array.isArray(value) ? value.join(", ") : value ?? null;
      }
    }
  };
}

async function requestJson(port, path) {
  assert(path.startsWith("/") && !path.includes("://"), `Invalid E2E request path: ${path}`);
  const { incoming, text } = await readLoopbackResponse(port, path);
  return { response: toResponse(incoming), body: parseJsonBody(text, path) };
}

async function waitForHealth(port, child, logBuffer) {
  const deadline = Date.now() + startupTimeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`BFF exited before health check passed:\n${logBuffer()}`);
    }
    try {
      const { response, body } = await requestJson(port, "/health");
      if (response.status === 200 && body?.status === "ok") {
        return;
      }
    } catch {
      // Keep polling until the server is listening or the startup deadline hits.
    }
    await delay(100);
  }
  throw new Error(`BFF did not become healthy within ${startupTimeoutMs}ms:\n${logBuffer()}`);
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  child.kill("SIGTERM");
  const result = await Promise.race([
    once(child, "exit").then(() => "exited"),
    delay(3_000).then(() => "timeout")
  ]);
  if (result === "timeout") {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

async function run() {
  assert(existsSync(serverEntry), "Missing apps/bff/dist/server.js. Run pnpm test:e2e from the repo root.");

  const port = await reservePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  let childOutput = "";
  const child = spawn(process.execPath, [serverEntry], {
    cwd: repoRoot,
    env: {
      ...process.env,
      INSTITUTION_ID: "mockuni",
      BFF_PORT: String(port),
      PUBLIC_EVENTS_MODE: "mock",
      PUBLIC_EVENTS_DATE: "2026-02-25T12:00:00.000Z",
      BFF_REQUIRE_AUTH: "0",
      BFF_AUTH_TOKEN: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const appendOutput = (chunk) => {
    childOutput += chunk.toString();
  };
  child.stdout.on("data", appendOutput);
  child.stderr.on("data", appendOutput);

  try {
    await waitForHealth(port, child, () => childOutput);

    const health = await requestJson(port, "/health");
    assert(health.response.status === 200, "health should return 200");
    assert(health.body.institution === "mockuni", "health should report the selected institution");

    const events = await requestJson(port, "/events?limit=2");
    assert(events.response.status === 200, "events should return 200");
    assert(events.response.headers.get("x-data-mode") === "mock", "events should advertise mock data mode");
    assert(events.body._total === 10, "events should report all fixture events before pagination");
    assert(events.body.events.length === 2, "events should apply limit pagination");
    assert(events.body.events[0].title.includes("Mathematik"), "events should serve fixture event data");

    const rooms = await requestJson(port, "/rooms?campus=hauptcampus&search=H%C3%B6rsaal&limit=2");
    assert(rooms.response.status === 200, "rooms should return 200");
    assert(rooms.body._total === 3, "rooms should search within the selected campus before pagination");
    assert(rooms.body.rooms.length === 2, "rooms should apply pagination");
    assert(rooms.body.rooms.every((room) => room.campusId === "hauptcampus"), "rooms should honor campus filtering");

    const schedule = await requestJson(port, "/schedule?search=Mathematik&limit=1");
    assert(schedule.response.status === 200, "schedule should return 200");
    assert(schedule.response.headers.get("x-data-mode") === "mock", "schedule should advertise mock data mode");
    assert(schedule.body.schedule.length === 1, "schedule should apply limit pagination");
    assert(schedule.body.schedule[0].title === "Vorlesung Mathematik I", "schedule should parse fixture ICS data");

    const today = await requestJson(port, "/today?date=2026-02-25");
    assert(today.response.status === 200, "today should return 200");
    assert(today.body.events.length === 2, "today should return events for the requested campus-local date");
    assert(today.body.rooms.length >= 2, "today should include public rooms");

    const badQuery = await requestJson(port, "/events?limit=abc");
    assert(badQuery.response.status === 400, "invalid pagination should return 400");
    assert(badQuery.body.error?.code === "bad_request", "invalid pagination should use bad_request");

    console.log(`E2E PASS: BFF user-facing flows passed on ${baseUrl}`);
  } finally {
    await stopServer(child);
  }
}

run().catch((err) => {
  console.error(`E2E FAIL: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.cause) {
    console.error(err.cause);
  }
  process.exitCode = 1;
});
