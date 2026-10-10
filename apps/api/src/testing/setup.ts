/** Shared Vitest setup: isolated loopback servers and no pooled keep-alive sockets. */

import http from "node:http";
import { afterEach } from "vitest";
import { closeLoopbackServers } from "./loopback";

// Pooled keep-alive sockets must not outlive the server they were opened to.
http.globalAgent = new http.Agent({ keepAlive: false });

afterEach(closeLoopbackServers);
