/** Exercises the Expo export HTTP facade through its loopback server boundary. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

async function availablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function getResponse(port, path, method = "GET") {
  return new Promise((resolve, reject) => {
    const client = request({ host: "127.0.0.1", port, path, method }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ statusCode: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    client.once("error", reject);
    client.end();
  });
}

async function writeExportFixture(root) {
  const serverRoot = join(root, "server");
  const clientRoot = join(root, "client");
  await Promise.all([
    mkdir(join(serverRoot, "(tabs)"), { recursive: true }),
    mkdir(join(clientRoot, "_expo", "static"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(serverRoot, "(tabs)", "index.html"), "home route"),
    writeFile(join(clientRoot, "payload.bin"), Buffer.from([0, 1, 2, 255])),
    writeFile(join(root, "outside.html"), "outside route"),
  ]);
  await Promise.all([
    symlink(join(clientRoot, "payload.bin"), join(clientRoot, "_expo", "static", "app.js")),
    symlink(join(root, "outside.html"), join(serverRoot, "outside.html")),
  ]);
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
}

test("serves export files and preserves the HTTP response contract", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "concourse-export-http-"));
  const port = await availablePort();
  await writeExportFixture(root);
  const server = spawn(process.execPath, ["scripts/serve-expo-export.mjs", root], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(async () => {
    await stopServer(server);
    await rm(root, { recursive: true, force: true });
  });
  await once(server.stdout, "data");

  const get = await getResponse(port, "/_expo/static/app.js");
  assert.equal(get.statusCode, 200);
  assert.equal(get.headers["content-type"], "text/javascript; charset=utf-8");
  assert.equal(get.headers["cache-control"], "no-store");
  assert.deepEqual(get.body, Buffer.from([0, 1, 2, 255]));

  const head = await getResponse(port, "/_expo/static/app.js", "HEAD");
  assert.equal(head.statusCode, 200);
  assert.equal(head.headers["content-type"], "text/javascript; charset=utf-8");
  assert.equal(head.headers["cache-control"], "no-store");
  assert.equal(head.body.byteLength, 0);

  const method = await getResponse(port, "/", "POST");
  assert.equal(method.statusCode, 405);
  assert.equal(method.headers.allow, "GET, HEAD");
  assert.equal(method.body.toString(), "Method not allowed");

  const malformed = await getResponse(port, "/%E0%A4%A");
  assert.equal(malformed.statusCode, 400);
  assert.equal(malformed.body.toString(), "Bad request");

  const missing = await getResponse(port, "/missing");
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.body.toString(), "Not found");

  const outside = await getResponse(port, "/outside.html");
  assert.equal(outside.statusCode, 404);
  assert.equal(outside.body.toString(), "Not found");
});
