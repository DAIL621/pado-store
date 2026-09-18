import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Deterministic ledger/lock model + assertions tied to the actual SQL control flow.
// No SQL connection, RPC, provider call, or Production fixture is created.
const sql = readFileSync(new URL("../supabase/migrations/202609180900_refund_claim_guard_v3.sql", import.meta.url), "utf8");
const clean = sql.replace(/--[^\n]*/g, "");
const delegate = clean.indexOf("return public.pado_claim_refund_v2(");
assert.equal(clean.match(/return public\.pado_claim_refund_v2\(/g)?.length, 1);
const lock = clean.indexOf("where id=p_order_id for update");
const amount = clean.indexOf("v_prior_amount + p_requested_amount > v_payment.amount");
const quantity = clean.indexOf("v_prior_quantity + v_item.quantity > v_order_quantity");
assert(lock >= 0 && lock < amount && amount < quantity && quantity < delegate);
assert(clean.includes("v_stored_items is distinct from v_requested_items"));
assert(clean.includes("v_refund.requested_amount is distinct from p_requested_amount"));
assert(clean.includes("v_refund.request_fingerprint is distinct from p_request_fingerprint"));
assert(clean.includes("ri.order_item_id=v_item.\"orderItemId\""));
assert(clean.includes("where id=v_item.\"orderItemId\" and order_id=p_order_id"));
assert(clean.includes("group by i.\"orderItemId\" having count(*) > 1"));
assert.equal(clean.match(/status in \('pending','processing','reconciliation_required','partially_refunded','refunded'\)/g)?.length, 2);
assert(!/\b(commit|rollback|dblink|http|truncate|delete|drop|cascade)\b/i.test(clean));
assert(!/\b(insert\s+into|update\s+(public\.)?\w+\s+set|alter\s+table)\b/i.test(clean));
assert(!clean.includes("wvbdtiewkmwbdelajohy"));
assert(clean.includes("security definer") && clean.includes("set search_path=public,pg_temp"));
assert(clean.includes("from public,anon,authenticated") && clean.includes("to service_role"));
console.log("PASS SQL audit: lock, exact retry payload, live budgets before sole v2 call, no destructive DML");

const active = new Set(["pending", "processing", "reconciliation_required"]);
const effective = new Set([...active, "partially_refunded", "refunded"]);
const normalize = items => items.map(i => ({ id: i.id, qty: i.qty, amount: i.amount ?? 0, restore: i.restore ?? 0 })).sort((a,b) => a.id.localeCompare(b.id));
function claim(ledger, request) {
  const block = code => { throw Error(code); };
  if (ledger.refunds.some(r => r.status === "reconciliation_required")) block("REFUND_RECONCILIATION_REQUIRED");
  if (ledger.refunds.some(r => ["pending", "processing"].includes(r.status))) block("REFUND_ALREADY_PROCESSING");
  if (ledger.refunds.some(r => r.status === "refunded")) block("REFUND_ALREADY_REFUNDED");
  const retry = ledger.refunds.find(r => r.key === request.key);
  if (retry && (retry.fingerprint !== request.fingerprint || retry.amount !== request.amount)) block("IDEMPOTENCY_CONFLICT");
  if (retry?.status === "partially_refunded") return "REPLAY";
  if (retry && retry.status !== "failed") block("REFUND_ALREADY_PROCESSING");
  if (retry && JSON.stringify(normalize(retry.items)) !== JSON.stringify(normalize(request.items))) block("IDEMPOTENCY_CONFLICT");
  const used = ledger.refunds.filter(r => effective.has(r.status));
  const usedAmount = used.reduce((sum,r) => sum + (active.has(r.status) ? r.amount : r.approved),0);
  if (usedAmount + request.amount > ledger.paymentAmount) block("REFUND_AMOUNT_EXCEEDED");
  if (new Set(request.items.map(i => i.id)).size !== request.items.length) block("INVALID_REFUND_ITEM");
  for (const item of request.items) {
    const purchased = ledger.items[item.id];
    if (!purchased || item.qty < 1) block("INVALID_REFUND_ITEM");
    const prior = used.flatMap(r => r.items).filter(i => i.id === item.id).reduce((sum,i) => sum+i.qty,0);
    if (prior+item.qty > purchased) block("REFUND_QUANTITY_EXCEEDED");
  }
  if (retry) retry.status = "processing";
  else ledger.refunds.push({ ...structuredClone(request), status: "processing", approved: 0 });
  return "ALLOW";
}
const item = (id,qty) => ({ id,qty,amount:0,restore:qty });
const failed = (items,amount=5000) => ({ key:"A",fingerprint:"same-request",status:"failed",items,amount,approved:0 });
const completed = (items,amount=5000,status="partially_refunded") => ({ key:"B",fingerprint:"other",status,items,amount,approved:amount });
const ledger = (items,refunds,paymentAmount=20500) => ({ items,refunds,paymentAmount });
const request = (items,amount=5000,key="A") => ({ key,fingerprint:"same-request",items,amount });
function check(name, data, input, expected) {
  const before = JSON.stringify(data);
  let result;
  try { result=claim(data,input); } catch(e) { result=e.message; }
  assert.equal(result,expected,name);
  if (!['ALLOW','REPLAY'].includes(result)) assert.equal(JSON.stringify(data),before,`${name}: no claim mutation`);
  console.log(`PASS ${name}: ${result}`);
}
check("1 failed A + fully refunded B",ledger({X:1},[failed([item('X',1)]),completed([item('X',1)],5000,'refunded')]),request([item('X',1)]),'REFUND_ALREADY_REFUNDED');
check("1b same item consumed by partial refund",ledger({X:1,Y:1},[failed([item('X',1)]),completed([item('X',1)])]),request([item('X',1)]),'REFUND_QUANTITY_EXCEEDED');
check("2 balance reduced after failure",ledger({X:3},[failed([item('X',1)],15000),completed([item('X',1)],10000)]),request([item('X',1)],15000),'REFUND_AMOUNT_EXCEEDED');
check("3 quantity remainder is one",ledger({X:3},[failed([item('X',2)]),completed([item('X',2)])]),request([item('X',2)]),'REFUND_QUANTITY_EXCEEDED');
check("4 valid retry; failed amount not counted",ledger({X:3},[failed([item('X',1)],10000),completed([item('X',1)],10000)]),request([item('X',1)],10000),'ALLOW');
check("5 other item independent",ledger({X:2,Y:1},[failed([item('Y',1)]),completed([item('X',2)])]),request([item('Y',1)]),'ALLOW');
check("5b one exhausted item blocks entire mixed request",ledger({X:2,Y:1},[failed([item('X',1),item('Y',1)]),completed([item('Y',1)])]),request([item('X',1),item('Y',1)]),'REFUND_QUANTITY_EXCEEDED');
for (const [n,status,code] of [[6,'processing','REFUND_ALREADY_PROCESSING'],[7,'reconciliation_required','REFUND_RECONCILIATION_REQUIRED'],[8,'refunded','REFUND_ALREADY_REFUNDED']]) {
  for (const key of ['A','NEW']) check(`${n}/9 ${status}, key=${key}`,ledger({X:3},[completed([item('X',1)],5000,status)]),request([item('X',1)],5000,key),code);
}
check("9 new key cannot bypass item limit",ledger({X:1,Y:1},[failed([item('X',1)]),completed([item('X',1)])]),request([item('X',1)],5000,'NEW'),'REFUND_QUANTITY_EXCEEDED');
check("retry cannot substitute smaller payload",ledger({X:3},[failed([item('X',2)]),completed([item('X',2)])]),request([item('X',1)]),'IDEMPOTENCY_CONFLICT');
check("retry cannot lower claimed amount",ledger({X:3},[failed([item('X',1)],15000)]),request([item('X',1)],5000),'IDEMPOTENCY_CONFLICT');
check("new first refund",ledger({X:1},[]),request([item('X',1)]),'ALLOW');
check("duplicate request items",ledger({X:2},[]),request([item('X',1),item('X',1)]),'INVALID_REFUND_ITEM');
check("partial success replay does not reserve again",ledger({X:1,Y:1},[{...completed([item('X',1)]),key:'A',fingerprint:'same-request'}]),request([item('X',1)]),'REPLAY');

// Model the order-row serialization whose SQL placement is asserted above.
let tail=Promise.resolve();
const shared=ledger({X:3},[]);
const serialized = input => {
  const result=tail.then(()=>claim(shared,input));
  tail=result.catch(()=>{}); return result;
};
const outcomes=await Promise.allSettled([serialized(request([item('X',1)],5000,'FIRST')),serialized(request([item('X',1)],5000,'SECOND'))]);
assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
assert.equal(outcomes.filter(o=>o.status==='rejected')[0].reason.message,'REFUND_ALREADY_PROCESSING');
assert.equal(shared.refunds.length,1);
console.log("PASS 10 serialized concurrent model: one claim only; SQL concurrency not executed");
