import { createHash, randomUUID } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type RatePolicy = {
  key: string;
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h`;
  failClosed: boolean;
};

const policies = {
  orderCreate: { key: "order-create", limit: 5, window: "1 m", failClosed: true },
  paymentConfirm: { key: "payment-confirm", limit: 8, window: "10 m", failClosed: true },
  webhook: { key: "toss-webhook", limit: 120, window: "1 m", failClosed: true },
  oauthFailure: { key: "oauth-failure", limit: 20, window: "10 m", failClosed: true },
  addressWrite: { key: "address-write", limit: 20, window: "10 m", failClosed: true },
  adminLogin: { key: "admin-login", limit: 8, window: "10 m", failClosed: true },
  adminUpload: { key: "admin-upload", limit: 20, window: "1 m", failClosed: true },
  adminRefund: { key: "admin-refund", limit: 10, window: "10 m", failClosed: true },
  adminOrderWrite: { key: "admin-order-write", limit: 60, window: "1 m", failClosed: true }
} as const satisfies Record<string, RatePolicy>;

export type RatePolicyName = keyof typeof policies;

const developmentHits = new Map<string, number[]>();
const limiterCache = new Map<string, Ratelimit>();

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function clientIp(request: Request) {
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  const vercelIp = request.headers.get("x-vercel-ip");
  if (process.env.VERCEL && vercelForwarded) return vercelForwarded.split(",")[0].trim();
  if (process.env.VERCEL && vercelIp) return vercelIp.trim();
  if (process.env.NODE_ENV !== "production") {
    return request.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || request.headers.get("x-real-ip")
      || "local";
  }
  return "unknown";
}

function parseWindowMs(window: RatePolicy["window"]) {
  const [count, unit] = window.split(" ");
  const factor = unit === "s" ? 1_000 : unit === "m" ? 60_000 : 3_600_000;
  return Number(count) * factor;
}

function localLimit(identifier: string, policy: RatePolicy) {
  const now = Date.now();
  const windowMs = parseWindowMs(policy.window);
  const recent = (developmentHits.get(identifier) ?? []).filter((time) => time > now - windowMs);
  recent.push(now);
  developmentHits.set(identifier, recent);
  return {
    success: recent.length <= policy.limit,
    remaining: Math.max(0, policy.limit - recent.length),
    reset: now + windowMs
  };
}

function getRemoteLimiter(policy: RatePolicy) {
  const cached = limiterCache.get(policy.key);
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: `pado:security:v2:${policy.key}`,
    analytics: true
  });
  limiterCache.set(policy.key, limiter);
  return limiter;
}

export async function enforceRateLimit(
  request: Request,
  policyName: RatePolicyName,
  identity?: { userId?: string | null; resourceId?: string | null }
) {
  const policy = policies[policyName];
  const rawIdentity = [
    policy.key,
    clientIp(request),
    identity?.userId || "anonymous",
    identity?.resourceId || "-"
  ].join(":");
  const identifier = digest(rawIdentity);
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const remote = getRemoteLimiter(policy);

  if (!remote && process.env.NODE_ENV === "production") {
    console.error("SECURITY_RATE_LIMIT_UNAVAILABLE", { policy: policy.key, requestId });
    if (policy.failClosed) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { ok: false, code: "SECURITY_SERVICE_UNAVAILABLE", message: "보안 확인이 지연되고 있습니다. 잠시 후 다시 시도해주세요.", requestId },
          { status: 503, headers: { "Retry-After": "60", "X-Request-Id": requestId } }
        )
      };
    }
  }

  try {
    const result = remote ? await remote.limit(identifier) : localLimit(identifier, policy);
    if (!result.success) {
      const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      console.warn("SECURITY_RATE_LIMITED", { policy: policy.key, requestId });
      return {
        ok: false as const,
        response: NextResponse.json(
          { ok: false, code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", requestId },
          { status: 429, headers: { "Retry-After": String(retryAfter), "X-Request-Id": requestId } }
        )
      };
    }
    return { ok: true as const, requestId, remaining: result.remaining };
  } catch {
    console.error("SECURITY_RATE_LIMIT_ERROR", { policy: policy.key, requestId });
    if (policy.failClosed) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { ok: false, code: "SECURITY_SERVICE_UNAVAILABLE", message: "보안 확인이 지연되고 있습니다. 잠시 후 다시 시도해주세요.", requestId },
          { status: 503, headers: { "Retry-After": "60", "X-Request-Id": requestId } }
        )
      };
    }
    return { ok: true as const, requestId, remaining: 0 };
  }
}

export function rateLimitConfigurationStatus() {
  return {
    configured: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    provider: "upstash-redis",
    productionRequired: true
  };
}
