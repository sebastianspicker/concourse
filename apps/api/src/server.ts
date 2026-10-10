import http, { type RequestListener } from "node:http";
import { basename } from "node:path";
import { validateAuthConfiguration } from "./security/auth";
import { loadConfig, type BffConfig } from "./runtime/config";
import { loadInstitutionPack } from "./runtime/institution";
import { log, type LogLevel } from "./runtime/logger";
import { destroyCache } from "./sources/upstream/cache";

import { createRequestListener } from "./http/listener";

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export const SERVER_SHUTDOWN_TIMEOUT_MS = 10_000;
export type ShutdownSignal = "SIGINT" | "SIGTERM";

type ShutdownServer = {
  close(callback: (error?: Error) => void): unknown;
  closeAllConnections(): void;
  closeIdleConnections(): void;
};

type LifecycleLogger = (level: LogLevel, message: string, context?: Record<string, unknown>) => void;

export type ServerLifecycle = {
  shutdown(signal: ShutdownSignal): Promise<void>;
};

export type ServerLifecycleDependencies = {
  server: ShutdownServer;
  cleanup?: () => void;
  logger?: LifecycleLogger;
  shutdownTimeoutMs?: number;
};

type SignalSource = {
  on(signal: ShutdownSignal, listener: () => void): unknown;
  removeListener(signal: ShutdownSignal, listener: () => void): unknown;
};

export type StartServerDependencies = {
  config?: BffConfig;
  createServer?: (listener: RequestListener) => http.Server;
  listener?: RequestListener;
  signalSource?: SignalSource;
};

export type RunningServer = {
  lifecycle: ServerLifecycle;
  server: http.Server;
};

/** A startup validation failure that has already been logged. */
class StartupValidationError extends Error {
  override name = "StartupValidationError";
}

function failStartupValidation(cause: unknown): never {
  const message = normalizeError(cause).message;
  log("error", "startup_validation_failed", { message });
  throw new StartupValidationError(message, { cause });
}

function loadStartupConfig(env: NodeJS.ProcessEnv): BffConfig {
  try {
    return loadConfig(env);
  } catch (error: unknown) {
    failStartupValidation(error);
  }
}

function validateStartupConfiguration(config: BffConfig): void {
  try {
    validateAuthConfiguration(config);
    loadInstitutionPack(config.institutionId);
    log("info", "startup_validation_ok");
  } catch (error: unknown) {
    failStartupValidation(error);
  }
}

/** Creates an idempotent graceful shutdown with a hard connection deadline. */
export function createServerLifecycle(dependencies: ServerLifecycleDependencies): ServerLifecycle {
  const {
    server,
    cleanup = destroyCache,
    logger = log,
    shutdownTimeoutMs = SERVER_SHUTDOWN_TIMEOUT_MS
  } = dependencies;
  let shutdownPromise: Promise<void> | undefined;

  return {
    shutdown(signal) {
      if (shutdownPromise) return shutdownPromise;
      shutdownPromise = new Promise<void>((resolve) => {
        let completed = false;
        let deadlineReached = false;
        const finish = (reason: "deadline" | "drained", error?: Error) => {
          if (completed) return;
          completed = true;
          clearTimeout(deadline);
          try {
            cleanup();
          } catch (cleanupError: unknown) {
            logger("error", "server_shutdown_cleanup_failed", { message: normalizeError(cleanupError).message });
          }
          logger(error ? "error" : "info", "server_shutdown_complete", {
            reason,
            signal,
            ...(error ? { message: error.message } : {})
          });
          resolve();
        };
        const deadline = setTimeout(() => {
          deadlineReached = true;
          server.closeAllConnections();
          finish("deadline");
        }, shutdownTimeoutMs);

        logger("info", "server_shutdown_started", { signal, timeoutMs: shutdownTimeoutMs });
        server.close((error?: Error) => finish(deadlineReached ? "deadline" : "drained", error));
        server.closeIdleConnections();
      });
      return shutdownPromise;
    }
  };
}

/** Attaches both supported process signals to one idempotent lifecycle. */
export function installShutdownSignalHandlers(lifecycle: ServerLifecycle, signalSource: SignalSource = process): () => void {
  let detached = false;
  const detach = () => {
    if (detached) return;
    detached = true;
    signalSource.removeListener("SIGINT", onSigint);
    signalSource.removeListener("SIGTERM", onSigterm);
  };
  const shutdown = (signal: ShutdownSignal) => { void lifecycle.shutdown(signal).finally(detach); };
  const onSigint = () => shutdown("SIGINT");
  const onSigterm = () => shutdown("SIGTERM");
  signalSource.on("SIGINT", onSigint);
  signalSource.on("SIGTERM", onSigterm);
  return detach;
}

/** Starts the configured API and installs its graceful signal lifecycle. */
export function startServer(dependencies: StartServerDependencies = {}): RunningServer {
  const config = dependencies.config ?? loadStartupConfig(process.env);
  log("info", "server_starting", { port: config.port, institutionId: config.institutionId });
  validateStartupConfiguration(config);
  const server = (dependencies.createServer ?? http.createServer)(dependencies.listener ?? createRequestListener({ config }));
  const lifecycle = createServerLifecycle({ server });
  installShutdownSignalHandlers(lifecycle, dependencies.signalSource);
  server.listen(config.port, () => log("info", "server_listening", { port: config.port }));
  return { lifecycle, server };
}

function isEntrypoint(): boolean {
  const entry = process.argv[1];
  return entry ? ["server.ts", "server.js"].includes(basename(entry)) : false;
}

if (isEntrypoint()) {
  try {
    startServer();
  } catch (error: unknown) {
    if (!(error instanceof StartupValidationError)) log("error", "server_start_failed", { message: normalizeError(error).message });
    destroyCache();
    process.exitCode = 1;
  }
}
