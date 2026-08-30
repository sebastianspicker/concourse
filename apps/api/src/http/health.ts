import type { IncomingMessage, ServerResponse } from "node:http";

import { BFF_ENV } from "../runtime/config";
import { loadInstitutionPack } from "../runtime/institution";
import { log } from "../runtime/logger";

const serverStartTime = Date.now();

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function getMemoryStatus(): { status: string; usedMB: number; totalMB: number } {
  const memUsage = process.memoryUsage();
  const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  
  const status = memUsage.heapUsed / memUsage.heapTotal > 0.9 ? "warning" : "ok";
  
  return { status, usedMB, totalMB };
}

export async function handleHealth(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  res.setHeader("Cache-Control", "no-store");

  const checks: Record<string, { status: string; message?: string }> = {};
  let overallStatus = "ok";

  try {
    await loadInstitutionPack(BFF_ENV.institutionId);
    checks.institutionPack = { status: "ok" };
  } catch (err: unknown) {
    overallStatus = "error";
    checks.institutionPack = {
      status: "error",
      message: "Failed to load institution pack"
    };
    log("error", "health_institution_failed", {
      message: err instanceof Error ? err.message : String(err)
    });
  }

  const memory = getMemoryStatus();
  checks.memory = { 
    status: memory.status,
    ...(memory.status === "warning" ? { message: `High memory usage: ${memory.usedMB}MB / ${memory.totalMB}MB` } : {})
  };
  if (memory.status === "warning" && overallStatus === "ok") {
    overallStatus = "warning";
  }

  const response = {
    status: overallStatus,
    version: process.env.APP_VERSION ?? process.env.npm_package_version ?? "development",
    institution: BFF_ENV.institutionId,
    uptime: formatUptime(Date.now() - serverStartTime),
    checks
  };

  const statusCode = overallStatus === "ok" ? 200 : overallStatus === "warning" ? 200 : 503;
  res.writeHead(statusCode, { "content-type": "application/json" });
  res.end(JSON.stringify(response));
}
