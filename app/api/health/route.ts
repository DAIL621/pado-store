import { NextResponse } from "next/server";
import { rateLimitConfigurationStatus } from "@/lib/security/rate-limit";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

const COMPONENT_TIMEOUT_MS = 1_500;
const OVERALL_TIMEOUT_MS = 4_000;

type CheckStatus = "ok" | "degraded" | "external";
type Check = {
  status: CheckStatus;
  latencyMs: number;
  detail?: string;
  error?: string;
};
type CheckResult = Omit<Check, "latencyMs">;
type AdminClient = ReturnType<typeof createAdminClient>;

class HealthTimeoutError extends Error {
  constructor(scope: string) {
    super(`${scope} timeout`);
    this.name = "HealthTimeoutError";
  }
}

function safeError(error: unknown) {
  return error instanceof HealthTimeoutError ? "timeout" : "unavailable";
}

async function withTimeout(
  name: string,
  check: () => Promise<CheckResult>,
  timeoutMs = COMPONENT_TIMEOUT_MS
): Promise<Check> {
  const startedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      check(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new HealthTimeoutError(name)), timeoutMs);
      })
    ]);
    return { ...result, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: "degraded",
      latencyMs: Date.now() - startedAt,
      detail: `${name} check unavailable`,
      error: safeError(error)
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function checkDatabase(db: AdminClient): Promise<CheckResult> {
  const result = await db.from("profiles").select("id", { count: "exact", head: true });
  if (result.error) throw new Error("database query failed");
  return { status: "ok", detail: "database reachable" };
}

async function checkMigration(db: AdminClient): Promise<CheckResult> {
  const result = await db.from("refunds").select("id", { count: "exact", head: true });
  if (result.error) throw new Error("migration query failed");
  return { status: "ok", detail: "P0 security schema available" };
}

async function checkStorage(db: AdminClient): Promise<CheckResult> {
  const result = await db.storage.listBuckets();
  if (result.error) throw new Error("storage API failed");
  return { status: "ok", detail: "storage API reachable" };
}

async function checkWebhook(db: AdminClient): Promise<CheckResult> {
  const result = await db.from("payment_events").select("id", { count: "exact", head: true });
  if (result.error) throw new Error("webhook ledger query failed");
  return { status: "ok", detail: "webhook event ledger available" };
}

async function checkRedis(): Promise<CheckResult> {
  const configuration = rateLimitConfigurationStatus();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!configuration.configured || !url || !token) {
    return { status: "degraded", detail: "rate limit provider not configured" };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/ping`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(COMPONENT_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error("redis ping failed");
  return { status: "ok", detail: configuration.provider };
}

async function checkToss(): Promise<CheckResult> {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY
    && process.env.TOSS_PAYMENTS_SECRET_KEY
  );
  return configured
    ? { status: "ok", detail: "provider credentials configured" }
    : { status: "degraded", detail: "provider credentials not configured" };
}

function unavailableSupabaseCheck(component: string): Check {
  return {
    status: "degraded",
    latencyMs: 0,
    detail: `${component} check unavailable`,
    error: "configuration missing"
  };
}

function overallTimeoutChecks(): Record<string, Check> {
  const timeoutCheck = (component: string): Check => ({
    status: "degraded",
    latencyMs: OVERALL_TIMEOUT_MS,
    detail: `${component} check unavailable`,
    error: "overall timeout"
  });
  return {
    database: timeoutCheck("database"),
    storage: timeoutCheck("storage"),
    migration: timeoutCheck("migration"),
    webhook: timeoutCheck("webhook"),
    redis: timeoutCheck("redis"),
    toss: timeoutCheck("toss"),
    integrityAudit: {
      status: "external",
      latencyMs: 0,
      detail: "run separately with INTEGRITY_AUDIT.sql"
    }
  };
}

async function runChecks(): Promise<Record<string, Check>> {
  const db = hasSupabaseAdminEnv() ? createAdminClient() : null;
  const [database, storage, migration, webhook, redis, toss] = await Promise.all([
    db ? withTimeout("database", () => checkDatabase(db)) : unavailableSupabaseCheck("database"),
    db ? withTimeout("storage", () => checkStorage(db)) : unavailableSupabaseCheck("storage"),
    db ? withTimeout("migration", () => checkMigration(db)) : unavailableSupabaseCheck("migration"),
    db ? withTimeout("webhook", () => checkWebhook(db)) : unavailableSupabaseCheck("webhook"),
    withTimeout("redis", checkRedis),
    withTimeout("toss", checkToss)
  ]);

  return {
    database,
    storage,
    migration,
    webhook,
    redis,
    toss,
    integrityAudit: {
      status: "external",
      latencyMs: 0,
      detail: "run separately with INTEGRITY_AUDIT.sql"
    }
  };
}

async function checksWithOverallDeadline() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      runChecks(),
      new Promise<Record<string, Check>>((resolve) => {
        timer = setTimeout(() => resolve(overallTimeoutChecks()), OVERALL_TIMEOUT_MS);
      })
    ]);
  } catch {
    return overallTimeoutChecks();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  const startedAt = Date.now();
  const checks = await checksWithOverallDeadline();
  const degraded = Object.values(checks).some((check) => check.status === "degraded");

  return NextResponse.json({
    service: "pado-story-store",
    status: degraded ? "degraded" : "ok",
    readiness: degraded ? "degraded" : "available",
    latencyMs: Date.now() - startedAt,
    checks,
    checkedAt: new Date().toISOString()
  }, {
    status: 200,
    headers: { "Cache-Control": "no-store" }
  });
}
