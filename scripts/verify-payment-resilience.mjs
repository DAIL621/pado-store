import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const timeout = read("lib/payments/toss-fetch.ts");
const confirm = read("app/api/payments/toss/confirm/route.ts");
const refund = read("app/api/admin/payments/refund/route.ts");
const webhook = read("app/api/payments/toss/webhook/route.ts");
const fail = read("app/api/payments/toss/fail/route.ts");
const expire = read("app/api/internal/orders/expire/route.ts");
const site = read("lib/site-url.ts");

assert(timeout.includes("TOSS_API_TIMEOUT_MS = 8_000"), "Toss timeout must be 8 seconds");
for (const [name, source] of Object.entries({ confirm, refund, webhook })) {
  assert(source.includes("tossFetch"), `${name} must use the timeout wrapper`);
}
assert(fail.includes("order.user_id !== user.id"), "failure route must verify ownership");
assert(fail.includes('order.status !== "pending"'), "failure route must protect terminal orders");
assert(fail.includes('payment.status !== "ready"'), "failure route must protect terminal payments");
assert(fail.includes("ignoreDuplicates: true"), "failure events must be idempotent");
assert(!fail.includes("paymentKey"), "failure return must not trust a payment key");
assert(expire.includes("timingSafeEqual"), "Cron authentication must be timing safe");
assert(expire.includes('request.headers.get("authorization")'), "Cron must use an authorization header");
assert(expire.includes("pado_expire_pending_orders_v2"), "Cron must use the existing expiration RPC");
assert(site.includes("NEXT_PUBLIC_SITE_URL is required in production"), "Production site URL must fail closed");

console.log("Payment resilience static verification PASS");
