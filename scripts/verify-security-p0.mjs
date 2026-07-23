import assert from "node:assert/strict";
import fs from "node:fs";

const scope = (process.argv.find((arg) => arg.startsWith("--scope=")) ?? "").split("=")[1] || "all";
const read = (file) => fs.readFileSync(file, "utf8");
const migration = read("supabase/migrations/202607231400_p0_security_v2.sql");
const rollback = read("supabase/migrations/rollback/202607231400_p0_security_v2.rollback.sql");
const audit = read("supabase/INTEGRITY_AUDIT.sql");
const orders = read("app/api/orders/route.ts");
const confirm = read("app/api/payments/toss/confirm/route.ts");
const refund = read("app/api/admin/payments/refund/route.ts");
const webhook = read("app/api/payments/toss/webhook/route.ts");
const limiter = read("lib/security/rate-limit.ts");
const origin = read("lib/security/origin.ts");

function checkOrder() {
  for (const token of ["security_version", "pado_create_order_v2", "idempotency-key", "auth.getUser",
    "Number.isSafeInteger", "MAX_TOTAL_QUANTITY", "requireTrustedOrigin", "orderCreate"]) {
    assert(orders.includes(token), `order security token missing: ${token}`);
  }
  assert(migration.includes("security_version smallint not null default 1"), "legacy rows must remain security_version=1");
  assert(migration.includes("where security_version = 2"), "v2 idempotency index is not scoped");
  assert(migration.includes("pado_expire_pending_orders_v2"), "pending expiry function missing");
}

function checkPayment() {
  for (const token of ["order.user_id !== user.id", "pado_claim_payment_v2", "pado_finalize_payment_v2",
    "validApprovedPayment", "PAYMENT_RECONCILIATION_REQUIRED", "cancelApprovedPayment"]) {
    assert(confirm.includes(token), `payment security token missing: ${token}`);
  }
  for (const token of ["for update", "payment_decrement", "stock=stock-v_item.quantity",
    "pado_mark_payment_reconciliation_v2"]) {
    assert(migration.toLowerCase().includes(token.toLowerCase()), `payment migration token missing: ${token}`);
  }
  assert(webhook.includes("tosspayments-webhook-transmission-id"), "webhook transmission id check missing");
  assert(webhook.includes("api.tosspayments.com/v1/payments/"), "webhook provider re-verification missing");
  assert(webhook.includes("payment_events"), "webhook deduplication ledger missing");
}

function checkRefund() {
  for (const token of ["pado_claim_refund_v2", "pado_finalize_refund_v2", "stock_restore_quantity",
    "REFUND_QUANTITY_EXCEEDED", "toss_cancel_transaction_key"]) {
    assert(migration.includes(token), `refund migration token missing: ${token}`);
  }
  for (const token of ["requireAdminApi", "requireTrustedOrigin", "adminRefund", "idempotency-key",
    "stockRestoreQuantity", "pado_finalize_refund_v2"]) {
    assert(refund.includes(token), `refund API token missing: ${token}`);
  }
}

function checkRateLimit() {
  assert(limiter.includes("@upstash/ratelimit") && limiter.includes("@upstash/redis"), "distributed limiter missing");
  assert(limiter.includes("Retry-After") && limiter.includes("status: 429"), "429 Retry-After response missing");
  assert(limiter.includes('process.env.NODE_ENV === "production"'), "production fail-closed branch missing");
  assert(origin.includes("PADO_ALLOWED_ORIGINS") && origin.includes("sec-fetch-site"), "origin allowlist missing");
}

if (scope === "all" || scope === "order") checkOrder();
if (scope === "all" || scope === "payment") checkPayment();
if (scope === "all" || scope === "refund") checkRefund();
if (scope === "all" || scope === "rate-limit") checkRateLimit();

assert(audit.includes("begin read only") && audit.includes("rollback;"), "integrity audit must be read-only");
assert(audit.includes("PASS") && audit.includes("WARNING") && audit.includes("FAIL"), "audit severities missing");
assert(audit.includes("orders") && audit.includes("payments") && audit.includes("refunds")
  && audit.includes("inventory") && audit.includes("shipments"), "audit domains missing");
assert(rollback.includes("pado_claim_refund_v2") && rollback.includes("security_version"), "rollback coverage missing");

console.log(JSON.stringify({ ok: true, scope, securityVersion: 2, legacyDataMutation: false }, null, 2));
