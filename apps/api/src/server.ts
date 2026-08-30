import http from "node:http";
import { basename } from "node:path";
import { validateAuthConfiguration } from "./security/auth";
import { BFF_ENV } from "./runtime/config";
import { loadInstitutionPack } from "./runtime/institution";
import { log } from "./runtime/logger";

import { createRequestListener } from "./http/listener";

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function validateStartupConfiguration(): void {
  try {
    validateAuthConfiguration();
    loadInstitutionPack(BFF_ENV.institutionId);
    log("info", "startup_validation_ok");
  } catch (error: unknown) {
    log("error", "startup_validation_failed", { message: normalizeError(error).message });
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  log("info", "server_starting", { port: BFF_ENV.port, institutionId: BFF_ENV.institutionId });
  validateStartupConfiguration();
  const server = http.createServer(createRequestListener());
  server.listen(BFF_ENV.port, () => log("info", "server_listening", { port: BFF_ENV.port }));
}

function isEntrypoint(): boolean {
  const entry = process.argv[1];
  return entry ? ["server.ts", "server.js"].includes(basename(entry)) : false;
}

if (isEntrypoint()) void startServer();
