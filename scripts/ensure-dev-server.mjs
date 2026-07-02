import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const port = Number(process.env.PADO_DEV_PORT || 3000);
const baseUrl = process.env.PADO_DEV_BASE_URL || `http://localhost:${port}`;
const healthUrl = `${baseUrl}/api/health`;
const adminNewUrl = `${baseUrl}/admin/new`;
const logDir = join(root, ".dev-server");
const stdoutLog = join(logDir, "dev-server.log");
const stderrLog = join(logDir, "dev-server.err.log");
const maxAttempts = Number(process.env.PADO_DEV_ENSURE_ATTEMPTS || 45);
const retryDelayMs = Number(process.env.PADO_DEV_ENSURE_DELAY_MS || 1000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(url) {
  try {
    const response = await fetch(url, { redirect: "manual", cache: "no-store" });
    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function commandForDisplay() {
  return process.platform === "win32" ? "pnpm.cmd run dev" : "pnpm run dev";
}

function startDevServer() {
  mkdirSync(logDir, { recursive: true });
  const out = openSync(stdoutLog, "a");
  const err = openSync(stderrLog, "a");

  if (process.platform === "win32") {
    const child = spawn("cmd.exe", ["/c", "start", "\"pado-dev-server\"", "/min", "pnpm.cmd", "run", "dev"], {
      cwd: root,
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    child.unref();
    return;
  }

  const child = spawn("pnpm", ["run", "dev"], {
    cwd: root,
    detached: true,
    stdio: ["ignore", out, err]
  });
  child.unref();
}

async function waitUntilReady() {
  let lastProbe;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    lastProbe = await probe(healthUrl);
    if (lastProbe.ok) return lastProbe;
    await sleep(retryDelayMs);
  }
  const reason = lastProbe?.error || `HTTP ${lastProbe?.status ?? "unknown"}`;
  throw new Error(`dev server did not become ready at ${healthUrl}: ${reason}`);
}

const current = await probe(healthUrl);
if (current.ok) {
  console.log(`dev server already running: ${healthUrl} -> ${current.status}`);
} else {
  console.log(`dev server is not responding: ${healthUrl}${current.error ? ` (${current.error})` : ""}`);
  console.log(`starting dev server with: ${commandForDisplay()}`);
  startDevServer();
  const ready = await waitUntilReady();
  console.log(`dev server started: ${healthUrl} -> ${ready.status}`);
}

const adminProbe = await probe(adminNewUrl);
if (!adminProbe.ok) {
  throw new Error(`/admin/new is not reachable: ${adminNewUrl} -> ${adminProbe.status || adminProbe.error}`);
}

console.log(`/admin/new reachable: ${adminNewUrl} -> ${adminProbe.status}`);
