import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
import ts from "typescript";

// Real route/component code; every external dependency is injected. No DB or network.
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
function load(path, modules = {}, globals = {}, suffix = "") {
  const code = ts.transpileModule(read(path) + suffix, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const context = { exports: {}, ...globals, require(name) {
    assert(name in modules, `Unexpected dependency ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(code, context);
  return context.exports;
}
const policy = load("lib/operations/status.ts");
const refunds = load("lib/payments/refund-state.ts");
const id = "11111111-1111-4111-8111-111111111111";
const key = "22222222-2222-4222-8222-222222222222";
const approved = { status: "paid", payment_key: "mock-key", approved_at: "2026-09-18T00:00:00Z", amount: 20500 };
const ready = { status: "ready", payment_key: null, approved_at: null, amount: 20500 };
const order = (status = "paid", payment = approved) => ({
  id, order_no: "MOCK-ONLY", status, security_version: 2, payments: payment,
  shipments: { carrier: "CJ대한통운", tracking_number: "1234567890" },
  order_items: [{ id, quantity: 1, unit_price: 20500 }]
});
for (const target of ["paid", "preparing", "delivery_ready", "shipped", "delivered", "refunded"]) {
  assert.equal(policy.canAdminChangeOrderStatus("pending", target, ready), false);
}
assert.equal(policy.canAdminChangeOrderStatus("paid", "refunded", approved), false);
for (const from of policy.orderStatuses) {
  for (const target of ["paid", "refunded"]) {
    if (from !== target) assert.equal(policy.canAdminChangeOrderStatus(from, target, approved), false);
  }
}
for (const [from, to] of [["paid", "preparing"], ["preparing", "delivery_ready"], ["preparing", "shipped"], ["shipped", "delivered"]]) {
  assert.equal(policy.canAdminChangeOrderStatus(from, to, approved), true);
  for (const payment of [ready, null, { ...approved, payment_key: null }, { ...approved, approved_at: null }, { ...approved, status: "refunded" }]) {
    assert.equal(policy.canAdminChangeOrderStatus(from, to, payment), false);
  }
}
console.log("PASS manual transitions and payment evidence");

function fixture(current, existing = [], options = {}) {
  const effects = { writes: 0, toss: 0, claims: 0, restores: 0 };
  const db = {
    from(table) {
      let mutation = false;
      const q = {
        select() { return q; }, eq() { return q; }, in() { return q; },
        update() { mutation = true; effects.writes++; return q; },
        insert() { mutation = true; effects.writes++; return q; },
        upsert() { mutation = true; effects.writes++; return q; },
        single: async () => ({ data: current, error: null }),
        maybeSingle: async () => table === "orders" ? { data: current, error: null }
          : { data: { status: "refunded", approved_amount: 20500 }, error: null },
        then(resolve, reject) {
          return Promise.resolve({ data: mutation ? [{ id }] : table === "orders" ? [current] : existing,
            error: options.readError && table === "refunds" ? { message: "mock read failure" } : null }).then(resolve, reject);
        }
      };
      return q;
    },
    async rpc(name) {
      if (name === "pado_claim_refund_v3") {
        effects.claims++;
        if (options.claimError) return { error: options.claimError };
        return { data: { refundId: id, paymentKey: "mock-key", status: "processing", alreadyProcessed: false, amount: 20500 } };
      }
      if (name === "pado_finalize_refund_v2") { effects.restores++; return { data: { status: "refunded" } }; }
      assert(["pado_fail_refund_v2", "pado_mark_refund_reconciliation_v2"].includes(name), name);
      return { data: {} };
    }
  };
  const modules = {
    crypto,
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/auth/admin-api": { requireAdminApi: async () => ({ ok: true, session: { user: { id } } }) },
    "@/lib/api/request": { readJsonBody: async (request) => ({ ok: true, body: await request.json() }) },
    "@/lib/security/origin": { requireTrustedOrigin: () => ({ ok: true }) },
    "@/lib/security/rate-limit": { enforceRateLimit: async () => ({ ok: true }) },
    "@/lib/supabase/admin": { createAdminClient: () => db },
    "@/lib/operations/status": policy,
    "@/lib/payments/refund-state": refunds,
    "@/lib/shipping/tracking": { isValidTrackingNumber: () => true },
    "@/lib/operations/automation": {
      buildOrderStatusAutomation: async () => ({ events: [] }),
      ...Object.fromEntries(["writeNotificationEventsBestEffort", "writeOperationLogBestEffort", "writeOrderStatusHistoryBestEffort", "writeReviewRequestsBestEffort"].map(name => [name, async () => ({ ok: true })]))
    },
    "@/lib/payments/toss-fetch": {
      TossApiTimeoutError: class extends Error {},
      tossFetch: async () => {
        effects.toss++;
        if (options.timeout) throw Error("mock timeout");
        if (options.providerError) return Response.json({ code: "MOCK_UNAVAILABLE" }, { status: 500 });
        return Response.json({ paymentKey: "mock-key", orderId: "MOCK-ONLY", totalAmount: 20500,
          cancels: [{ cancelStatus: "DONE", cancelAmount: 20500, transactionKey: "mock-cancel" }] });
      }
    }
  };
  return { effects, modules, globals: { Buffer, process: { env: { TOSS_PAYMENTS_SECRET_KEY: "mock-only" } } } };
}
const request = (body) => new Request("https://local.invalid/mock", { method: "POST", body: JSON.stringify(body) });
for (const bulk of [false, true]) {
  for (const [from, payment, to, allowed] of [
    ...["paid", "preparing", "shipped", "delivered", "refunded"].map(to => ["pending", ready, to, false]),
    ["paid", approved, "refunded", false], ["paid", ready, "preparing", false],
    ["preparing", { ...approved, approved_at: null }, "shipped", false],
    ["paid", approved, "preparing", true], ["preparing", approved, "shipped", true],
    ["shipped", approved, "delivered", true]
  ]) {
    const f = fixture(order(from, payment));
    const route = load(bulk ? "app/api/admin/orders/route.ts" : "app/api/admin/orders/[id]/route.ts", f.modules);
    const response = bulk ? await route.POST(request({ ids: [id], status: to }))
      : await route.PATCH(request({ status: to, internalNote: "must not write when blocked" }), { params: Promise.resolve({ id }) });
    assert.equal(response.ok, allowed, `${bulk ? "bulk" : "single"} ${from}->${to}`);
    if (!allowed) assert.equal(f.effects.writes, 0);
  }
}
console.log("PASS actual single and bulk APIs reject before any write; paid fulfillment preserved");
const refundBody = { orderId: id, idempotencyKey: key, amount: 20500, reason: "mock only" };
for (const [label, current, existing, options, status] of [
  ["A paid", order(), [], {}, 200],
  ["B processing", order(), [{ status: "processing" }], {}, 409],
  ["C reconciliation/new key", order(), [{ status: "reconciliation_required" }], {}, 409],
  ["pending refund", order(), [{ status: "pending" }], {}, 409],
  ["D refunded", order("refunded", { ...approved, status: "refunded" }), [], {}, 409],
  ["E unpaid", order("pending", ready), [], {}, 409],
  ["read failure", order(), [], { readError: true }, 503],
  ["atomic concurrent guard", order(), [], { claimError: { message: "REFUND_ALREADY_PROCESSING" } }, 409],
  ["atomic reconciliation guard", order(), [], { claimError: { message: "REFUND_RECONCILIATION_REQUIRED" } }, 409],
  ["failed retry amount exceeds balance", order(), [], { claimError: { message: "REFUND_AMOUNT_EXCEEDED" } }, 409],
  ["failed retry quantity exceeds remainder", order(), [], { claimError: { message: "REFUND_QUANTITY_EXCEEDED" } }, 409],
  ["migration missing", order(), [], { claimError: { message: "not installed", code: "PGRST202" } }, 503],
  ["uncertain cancel", order(), [], { timeout: true }, 202],
  ["provider 500 uncertainty", order(), [], { providerError: true }, 202]
]) {
  const f = fixture(current, existing, options);
  const route = load("app/api/admin/payments/refund/route.ts", f.modules, f.globals);
  const response = await route.POST(request(refundBody));
  assert.equal(response.status, status, label);
  assert.equal(f.effects.toss, status === 200 || status === 202 ? 1 : 0, `${label}: Toss calls`);
  assert.equal(f.effects.restores, status === 200 ? 1 : 0, `${label}: finalize calls`);
  if (existing.length) assert.equal(f.effects.claims, 0, `${label}: no new refund`);
  console.log(`PASS ${label}`);
}
for (const status of ["processing", "reconciliation_required", "refunded"]) {
  const f = fixture(order(), [{ status }]);
  const route = load("app/api/admin/payments/refund/route.ts", f.modules, f.globals);
  for (const idempotencyKey of [key, "33333333-3333-4333-8333-333333333333"]) {
    assert.equal((await route.POST(request({ ...refundBody, idempotencyKey }))).status, 409);
  }
  assert.equal(f.effects.claims, 0);
  assert.equal(f.effects.toss, 0);
  assert.equal(f.effects.restores, 0);
}
console.log("PASS repeated requests and new-key bypass blocked without claim/cancel/restore");

async function checkUI(label, httpStatus, body, existing = [], current = order(), networkError = false) {
  let states = [], refs = [], cursor = 0, refCursor = 0, calls = 0, saved = 0;
  const jsx = (type, props) => ({ type, props });
  const component = load("components/admin/AdminOrdersManager.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    react: {
      useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], v => { states[i] = v; }]; },
      useRef(initial) { return refs[refCursor++] ??= { current: initial }; }
    },
    "next/navigation": {}, "@/data/products": { formatPrice: String },
    "@/lib/shipping/tracking-url": {}, "@/lib/shipping/tracking": {},
    "@/lib/operations/status": policy, "@/lib/payments/refund-state": refunds,
    "@/components/admin/ui": {}
  }, {
    window: { confirm: () => true }, crypto,
    fetch: async () => { calls++; if (networkError) throw Error("mock network"); return Response.json(body, { status: httpStatus }); }
  }, "\nexport { OrderDetailModal };\n");
  const render = () => { cursor = refCursor = 0; return component.OrderDetailModal({ order: { ...current, refunds: existing }, onClose() {}, onSaved: async () => { saved++; } }); };
  const nodes = tree => {
    const result = [];
    const walk = n => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === "object") { result.push(n); walk(n.props?.children); } };
    walk(tree); return result;
  };
  const refundButton = tree => nodes(tree).find(n => n.type === "button" && n.props.className === "button danger");
  const button = refundButton(render());
  const blocked = existing.length > 0 || current.status !== "paid";
  if (blocked) { assert(!button || button.props.disabled, label); return; }
  button.props.onClick();
  await new Promise(setImmediate);
  const tree = render();
  const success = refunds.classifyRefundResponse(httpStatus, body) === "success" && !networkError;
  assert.equal(saved, success ? 1 : 0, label);
  assert.equal(nodes(tree).some(n => n.type === "p" && n.props.role === "status" && n.props.children === "환불완료"), success, label);
  if (httpStatus === 202 || networkError || body?.code === "REFUND_RECONCILIATION_REQUIRED") {
    assert(refundButton(tree).props.disabled, label);
    refundButton(tree).props.onClick(); await new Promise(setImmediate);
    assert.equal(calls, 1, `${label}: no retry`);
  }
  console.log(`PASS UI ${label}`);
}
await checkUI("F confirmed", 200, { ok: true, refund: { status: "refunded" } });
await checkUI("G 202", 202, { ok: false });
await checkUI("202 even with success body", 202, { ok: true, refund: { status: "refunded" } });
await checkUI("H 400", 400, { ok: false });
await checkUI("H 500", 500, { ok: false });
await checkUI("200 incomplete", 200, { ok: true });
await checkUI("409 reconciliation", 409, { ok: false, code: "REFUND_RECONCILIATION_REQUIRED" });
await checkUI("network uncertainty", 200, {}, [], order(), true);
await checkUI("existing processing", 200, {}, [{ status: "processing" }]);
await checkUI("existing reconciliation", 200, {}, [{ status: "reconciliation_required" }]);
await checkUI("unpaid", 200, {}, [], order("pending", ready));

// SQL structure only: no migration execution or claim of live concurrency testing.
const sql = read("supabase/migrations/202609180900_refund_claim_guard_v3.sql");
assert(sql.indexOf("for update") < sql.indexOf("REFUND_RECONCILIATION_REQUIRED"));
assert(sql.indexOf("REFUND_ALREADY_PROCESSING") < sql.indexOf("return public.pado_claim_refund_v2"));
const outstandingGuard = sql.slice(sql.indexOf("if exists"), sql.indexOf("if p_idempotency_key"));
assert(!outstandingGuard.includes("idempotency_key"), "outstanding guard must be order-wide");
const original = read("supabase/migrations/202607231400_p0_security_v2.sql");
assert(original.includes("event_key text not null unique"));
const finalize = original.slice(original.indexOf("create or replace function public.pado_finalize_refund_v2"), original.indexOf("create or replace function public.pado_fail_refund_v2"));
assert(finalize.indexOf("alreadyFinalized") < finalize.indexOf("stock=stock+"));
assert(finalize.includes("for update") && finalize.includes("'refund_restore'"));
console.log("PASS atomic guard and existing inventory idempotency SQL structure (not executed)");
