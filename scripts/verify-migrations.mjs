import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const configPath = path.join(root, "supabase", "config.toml");
const projectRefPath = path.join(root, "supabase", ".temp", "project-ref");
const strictRemote = process.env.PADO_REQUIRE_REMOTE_MIGRATIONS === "true";

function fail(message) {
  console.error(`[migration verification] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(configPath)) fail("supabase/config.toml is missing. Run `supabase init`.");
if (!fs.existsSync(migrationsDir)) fail("supabase/migrations is missing.");

const migrations = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && /^\d{12,14}_[a-z0-9_]+\.sql$/i.test(entry.name))
  .map((entry) => ({ name: entry.name, version: entry.name.split("_")[0] }))
  .sort((a, b) => a.version.localeCompare(b.version));

if (migrations.length === 0) fail("No timestamped SQL migrations were found.");
const versions = migrations.map((migration) => migration.version);
if (new Set(versions).size !== versions.length) fail("Duplicate migration versions were found.");

const config = fs.readFileSync(configPath, "utf8");
if (!/\[db\.migrations\][\s\S]*?enabled\s*=\s*true/.test(config)) {
  fail("Database migrations are disabled in supabase/config.toml.");
}

const hasProjectRef = fs.existsSync(projectRefPath);
const hasCredentials = Boolean(process.env.SUPABASE_ACCESS_TOKEN && process.env.SUPABASE_DB_PASSWORD);

if (!hasProjectRef || !hasCredentials) {
  if (strictRemote) {
    fail("Remote verification requires a linked project plus SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD.");
  }
  console.log(JSON.stringify({
    ok: true,
    localMigrations: migrations.length,
    remote: "not-checked",
    reason: !hasProjectRef ? "project-not-linked" : "credentials-not-present",
  }, null, 2));
  process.exit(0);
}

const cli = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "supabase.cmd" : "supabase");
if (!fs.existsSync(cli)) fail("Supabase CLI is not installed. Run `pnpm install`.");

const result = spawnSync(cli, ["migration", "list", "--linked"], {
  cwd: root,
  env: process.env,
  encoding: "utf8",
  shell: process.platform === "win32",
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replace(/\u001b\[[0-9;]*m/g, "");
if (result.status !== 0) fail(`Supabase migration history query failed.\n${output.trim()}`);

const missingRemote = versions.filter((version) => {
  const line = output.split(/\r?\n/).find((candidate) => candidate.includes(version));
  if (!line) return true;
  const columns = line.split(/[│|]/).map((column) => column.trim()).filter(Boolean);
  return !(columns[0]?.includes(version) && columns[1]?.includes(version));
});

if (missingRemote.length > 0) {
  fail(`Remote migration history is not synchronized: ${missingRemote.join(", ")}`);
}

console.log(JSON.stringify({ ok: true, localMigrations: migrations.length, remote: "synchronized" }, null, 2));
