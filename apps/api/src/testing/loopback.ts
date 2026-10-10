/** Gives supertest-driven tests loopback servers that cannot collide with other listeners. */

import type http from "node:http";

const listening = new Set<http.Server>();

/**
 * Binds the server to 127.0.0.1 once. Letting supertest call listen(0) per
 * request binds the IPv6 wildcard, which macOS lets share a port with an
 * unrelated 127.0.0.1 listener, so requests could reach the wrong server.
 */
export async function listenOnLoopback(server: http.Server): Promise<http.Server> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  listening.add(server);
  return server;
}

/** Closes every server opened by listenOnLoopback, including open connections. */
export async function closeLoopbackServers(): Promise<void> {
  const servers = [...listening];
  listening.clear();
  await Promise.all(servers.map((server) => new Promise<void>((resolve) => {
    server.closeAllConnections();
    server.close(() => resolve());
  })));
}
