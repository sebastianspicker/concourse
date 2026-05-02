import { afterEach, describe, expect, it } from "vitest";
import http from "node:http";
import { createRequestListener } from "../server";

function listenOnDynamicPort(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve(addr.port);
      } else {
        reject(new Error("Server address is not available"));
      }
    });
    server.on("error", reject);
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function httpGet(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk: string) => { data += chunk; });
      res.on("end", () => {
        resolve({ status: res.statusCode ?? 0, body: data });
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error("Request timeout"));
    });
  });
}

describe("BFF server lifecycle", () => {
  let server: http.Server | null = null;

  afterEach(async () => {
    if (server?.listening) {
      await closeServer(server);
    }
    server = null;
  });

  it("starts and listens on a dynamic port (port 0)", async () => {
    server = http.createServer(createRequestListener());
    const port = await listenOnDynamicPort(server);

    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
    expect(server.listening).toBe(true);
  });

  it("health endpoint responds 200 during normal operation", async () => {
    server = http.createServer(createRequestListener());
    const port = await listenOnDynamicPort(server);

    const { status, body } = await httpGet(port, "/health");

    expect(status).toBe(200);
    const parsed = JSON.parse(body);
    expect(parsed).toHaveProperty("status", "ok");
  });

  it("closes gracefully on server.close()", async () => {
    server = http.createServer(createRequestListener());
    await listenOnDynamicPort(server);

    expect(server.listening).toBe(true);
    await closeServer(server);
    expect(server.listening).toBe(false);
  });

  it("refuses new connections after close", async () => {
    server = http.createServer(createRequestListener());
    const port = await listenOnDynamicPort(server);

    // Verify the server works before closing
    const preClose = await httpGet(port, "/health");
    expect(preClose.status).toBe(200);

    await closeServer(server);

    // After close, new connections should be refused
    await expect(httpGet(port, "/health")).rejects.toThrow();
  });

  it("responds to data routes while running", async () => {
    server = http.createServer(createRequestListener());
    const port = await listenOnDynamicPort(server);

    const { status } = await httpGet(port, "/rooms");

    expect(status).toBe(200);
  });

  it("returns 404 for unknown routes while running", async () => {
    server = http.createServer(createRequestListener());
    const port = await listenOnDynamicPort(server);

    const { status, body } = await httpGet(port, "/nonexistent");

    expect(status).toBe(404);
    const parsed = JSON.parse(body);
    expect(parsed.error.code).toBe("not_found");
  });
});
