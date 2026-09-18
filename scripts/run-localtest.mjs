import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const projectDir = process.cwd();
const mode = process.argv[2] ?? "check";
const envPath = resolve(projectDir, ".env.localtest");
const productionRef = "wvbdtiewkmwbdelajohy";
const previewRef = "xhplfyfvvxpnvoiiomjz";
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

function readEnvFile(path) {
  if (!existsSync(path)) {
    return new Map();
  }

  const values = new Map();
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

function decodeRole(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
    return payload.role ?? "unknown";
  } catch {
    return "unknown";
  }
}

function fail(message) {
  console.error(`[LOCAL TEST] FAIL CLOSED: ${message}`);
  process.exit(1);
}

function validate(localValues) {
  for (const key of required) {
    if (!localValues.get(key)) fail(`${key} is missing in .env.localtest`);
  }

  const supabaseUrl = localValues.get("NEXT_PUBLIC_SUPABASE_URL");
  const siteUrl = localValues.get("NEXT_PUBLIC_SITE_URL");
  if (supabaseUrl !== "http://127.0.0.1:54321") {
    fail("NEXT_PUBLIC_SUPABASE_URL must be http://127.0.0.1:54321");
  }
  if (!["http://127.0.0.1:3001", "http://127.0.0.1:3002"].includes(siteUrl)) {
    fail("NEXT_PUBLIC_SITE_URL must be http://127.0.0.1:3001 or http://127.0.0.1:3002");
  }

  for (const [key, value] of localValues.entries()) {
    if (value.includes(productionRef)) fail(`${key} contains the production Supabase ref`);
    if (value.includes(previewRef)) fail(`${key} contains the old preview Supabase ref`);
  }

  const productionValues = readEnvFile(resolve(projectDir, ".env.local"));
  const previewValues = readEnvFile(resolve(projectDir, ".env.preview.local"));
  for (const key of ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    const localValue = localValues.get(key);
    if (localValue && localValue === productionValues.get(key)) {
      fail(`${key} matches .env.local`);
    }
    if (localValue && localValue === previewValues.get(key)) {
      fail(`${key} matches .env.preview.local`);
    }
  }

  const anonRole = decodeRole(localValues.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  const serviceRole = decodeRole(localValues.get("SUPABASE_SERVICE_ROLE_KEY"));
  if (anonRole !== "anon") fail("NEXT_PUBLIC_SUPABASE_ANON_KEY is not an anon JWT");
  if (serviceRole !== "service_role") fail("SUPABASE_SERVICE_ROLE_KEY is not a service_role JWT");
}

function applyLocalEnv(localValues) {
  for (const [key, value] of localValues.entries()) {
    process.env[key] = value;
  }
  process.env.PADO_LOCAL_TEST_MODE = "true";
  process.env.PORT = new URL(localValues.get("NEXT_PUBLIC_SITE_URL")).port;
}

function localTestPort(localValues) {
  return new URL(localValues.get("NEXT_PUBLIC_SITE_URL")).port;
}

function printBanner(localValues) {
  const port = localTestPort(localValues);
  console.log("====================================");
  console.log("PADO LOCAL TEST MODE");
  console.log("Supabase: LOCAL");
  console.log("Endpoint: 127.0.0.1:54321");
  console.log(`Site: 127.0.0.1:${port}`);
  console.log("Anon credential: LOCAL / loaded");
  console.log("Service role credential: LOCAL / loaded");
  console.log("Production Supabase: BLOCKED");
  console.log("Old Preview Supabase: BLOCKED");
  console.log("====================================");
}

const localValues = readEnvFile(envPath);
validate(localValues);
applyLocalEnv(localValues);
printBanner(localValues);

if (mode === "check") {
  process.exit(0);
}

const commands = {
  dev: ["next", ["dev", "-p", localTestPort(localValues)]],
  build: ["next", ["build"]],
  start: ["next", ["start", "-p", localTestPort(localValues)]],
};

const command = commands[mode];
if (!command) {
  fail(`unknown mode: ${mode}`);
}

const child = spawn(command[0], command[1], {
  cwd: projectDir,
  env: process.env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }
  process.exit(code ?? 1);
});
