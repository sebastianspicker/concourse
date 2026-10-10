import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function docker(args, options = {}) {
  const result = spawnSync("docker", args, { encoding: "utf8", timeout: 60_000, ...options });
  if (result.error || result.status !== 0) throw new Error(`Container smoke command failed (${args[0]}): ${result.stderr ?? ""}`, { cause: result.error });
  return result.stdout.trim();
}

export function smokeImage(image, version) {
  let container;
  let invalidContainer;
  try {
    container = docker(["run", "--detach", "--env", "INSTITUTION_ID=example", "--env", "BFF_PORT=4107", image]);
    docker(["exec", container, "node", "-e", `
      if (process.getuid() === 0) throw new Error('Runtime must be non-root');
      const fs = require('node:fs');
      if (!fs.existsSync('dist/server.js')) throw new Error('Compiled entrypoint missing');
      for (const name of ['@concourse/contracts', '@concourse/institutions', 'rrule', 'zod']) require(name);
      (async () => {
        for (let attempt = 0; attempt < 60; attempt++) {
          try {
            const response = await fetch('http://127.0.0.1:4107/health', {signal: AbortSignal.timeout(1000)});
            const body = await response.json();
            if (!response.ok || body.status !== 'ok' || body.version !== process.argv[1]) throw new Error('Unexpected health or version');
            return;
          } catch (error) {
            if (attempt === 59) throw error;
            await new Promise(resolve => setTimeout(resolve, 250));
          }
        }
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `, version]);
    // Execute the image's declared health check with its non-default port.
    const health = JSON.parse(docker(["inspect", "--format", "{{json .Config.Healthcheck.Test}}", container]));
    if (health?.[0] !== "CMD-SHELL") throw new Error("Expected an image health check");
    docker(["exec", container, "sh", "-c", health[1]]);
    docker(["exec", "--interactive", container, "node"], { input: readFileSync(new URL("./container-drain-probe.cjs", import.meta.url), "utf8") });
    docker(["stop", "--time", "15", container]);
    if (docker(["inspect", "--format", "{{.State.ExitCode}}", container]) !== "0") throw new Error("Image did not shut down cleanly");

    invalidContainer = docker(["create", "--env", "INSTITUTION_ID=example", "--env", "BFF_PORT=invalid", image]);
    const invalid = spawnSync("docker", ["start", "--attach", invalidContainer], { encoding: "utf8", timeout: 15_000 });
    if (invalid.error || invalid.status === 0 || !`${invalid.stdout}${invalid.stderr}`.includes("Invalid BFF_PORT")) throw new Error("Image did not reject invalid startup configuration");
    process.stdout.write(`OK: ${image} runtime dependencies, non-root health, configuration, and shutdown\n`);
  } finally {
    for (const id of [invalidContainer, container].filter(Boolean)) docker(["rm", "--force", id]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [image, version] = process.argv.slice(2);
    if (!image || !version) throw new Error("Usage: node scripts/smoke-api-image.mjs IMAGE VERSION");
    smokeImage(image, version);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
