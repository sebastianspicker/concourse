/** Verifies strict port parsing at both valid boundaries and malformed-input cases. */
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { describe, it, test } from "node:test";

import { parsePort } from "./serve-expo-export-port.mjs";

describe("parsePort", () => {
  it("accepts the default, bounds, and surrounding whitespace", () => {
    assert.equal(parsePort(undefined), 8081);
    assert.equal(parsePort("1"), 1);
    assert.equal(parsePort(" 65535 "), 65_535);
  });

  it("rejects partial, exponent, empty, and out-of-range values", () => {
    for (const value of ["8081junk", "1e3", "", "0", "65536", "-1", "1.5"]) {
      assert.throws(() => parsePort(value), /PORT must be an integer between 1 and 65535/);
    }
  });
});

async function availablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function getResponse(port, pathname) {
  return new Promise((resolve, reject) => {
    get(`http://127.0.0.1:${port}${pathname}`, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({ statusCode: response.statusCode, body }));
    }).once("error", reject);
  });
}

async function writeExportFixture(root) {
  const serverRoot = join(root, "server");
  await mkdir(join(serverRoot, "_expo"), { recursive: true });
  await Promise.all([
    writeFile(join(serverRoot, "_expo", "routes.json"), JSON.stringify({
      htmlRoutes: [
        { namedRegex: "(", page: "/events/[id]" },
        { namedRegex: "(", page: "/schedule/[...slug]" },
        { namedRegex: "(", page: "/rooms/[[...slug]]" },
        { namedRegex: "(", page: "/(tabs)/index" },
      ],
    })),
    mkdir(join(serverRoot, "events"), { recursive: true }),
    mkdir(join(serverRoot, "schedule"), { recursive: true }),
    mkdir(join(serverRoot, "rooms"), { recursive: true }),
    mkdir(join(serverRoot, "(tabs)"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(serverRoot, "events", "[id].html"), "event route"),
    writeFile(join(serverRoot, "schedule", "[...slug].html"), "schedule route"),
    writeFile(join(serverRoot, "rooms", "[[...slug]].html"), "rooms route"),
    writeFile(join(serverRoot, "(tabs)", "index.html"), "home route"),
  ]);
}

test("serves manifest routes without evaluating manifest regex text", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "concourse-export-"));
  const port = await availablePort();
  await writeExportFixture(root);
  const server = spawn(process.execPath, ["scripts/serve-expo-export.mjs", root], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(async () => {
    if (!server.killed) server.kill("SIGTERM");
    await once(server, "exit");
    await rm(root, { recursive: true, force: true });
  });

  await once(server.stdout, "data");
  await Promise.all([
    getResponse(port, "/events/welcome-concert").then((response) => assert.deepEqual(response, { statusCode: 200, body: "event route" })),
    getResponse(port, "/schedule/day/one").then((response) => assert.deepEqual(response, { statusCode: 200, body: "schedule route" })),
    getResponse(port, "/rooms").then((response) => assert.deepEqual(response, { statusCode: 200, body: "rooms route" })),
    getResponse(port, "/rooms/faculty/lobby").then((response) => assert.deepEqual(response, { statusCode: 200, body: "rooms route" })),
    getResponse(port, "/").then((response) => assert.deepEqual(response, { statusCode: 200, body: "home route" })),
  ]);
});
