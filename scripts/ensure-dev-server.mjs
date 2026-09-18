import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const port = Number(process.env.PADO_DEV_PORT || 3000);
const baseUrl = process.env.PADO_DEV_BASE_URL || `http://localhost:${port}`;
const candidateBaseUrls = [
  baseUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001"
].filter((url, index, urls) => urls.indexOf(url) === index);
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
    const text = await response.text().catch(() => "");
    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      body: text
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function isPadoHealth(probeResult) {
  if (!probeResult?.ok) return false;
  try {
    const payload = JSON.parse(probeResult.body || "{}");
    return payload.service === "pado-story-store";
  } catch {
    return false;
  }
}

async function findRunningPadoServer() {
  for (const candidate of candidateBaseUrls) {
    const healthUrl = `${candidate}/api/health`;
    const result = await probe(healthUrl);
    if (isPadoHealth(result)) {
      return { baseUrl: candidate, healthUrl, result };
    }
  }
  return null;
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
    const running = await findRunningPadoServer();
    if (running) return running;
    lastProbe = running?.result;
    await sleep(retryDelayMs);
  }
  const reason = lastProbe?.error || `HTTP ${lastProbe?.status ?? "unknown"}`;
  throw new Error(`dev server did not become ready as PADO STORE on ${candidateBaseUrls.join(", ")}: ${reason}`);
}

let running = await findRunningPadoServer();
if (running) {
  console.log(`dev server already running: ${running.healthUrl} -> ${running.result.status}`);
} else {
  console.log(`PADO STORE dev server is not responding on: ${candidateBaseUrls.join(", ")}`);
  console.log(`starting dev server with: ${commandForDisplay()}`);
  startDevServer();
  running = await waitUntilReady();
  console.log(`dev server started: ${running.healthUrl} -> ${running.result.status}`);
}

const adminNewUrl = `${running.baseUrl}/admin/new`;
const adminProbe = await probe(adminNewUrl);
if (!adminProbe.ok) {
  throw new Error(`/admin/new is not reachable: ${adminNewUrl} -> ${adminProbe.status || adminProbe.error}`);
}

console.log(`/admin/new reachable: ${adminNewUrl} -> ${adminProbe.status}`);
