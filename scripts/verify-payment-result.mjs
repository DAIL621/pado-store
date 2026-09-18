import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Execute the real component with isolated hooks and a mock fetch. No network or DB access.
const source = readFileSync(new URL("../components/payments/TossPaymentResult.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
}).outputText;

async function check(label, httpStatus, body, expected, throws = false) {
  const state = [];
  const refs = [];
  let cursor = 0;
  let refCursor = 0;
  let effect;
  let clears = 0;
  let requests = 0;
  const jsx = (type, props) => ({ type, props });
  const modules = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = value; }];
      },
      useRef(initial) { return refs[refCursor++] ??= { current: initial }; },
      useEffect(callback) { effect = callback; }
    },
    "next/link": { default: "a" },
    "@/components/cart/CartProvider": { useCart: () => ({ clearCart: () => { clears++; } }) },
    "@/data/products": { formatPrice: String }
  };
  const context = {
    exports: {},
    require(name) { assert(name in modules, `Unexpected dependency: ${name}`); return modules[name]; },
    async fetch(url, options) {
      requests++;
      assert.equal(url, "/api/payments/toss/confirm");
      assert.equal(options.method, "POST");
      if (throws) throw new Error("Mock network failure");
      return { status: httpStatus, ok: httpStatus >= 200 && httpStatus < 300, json: async () => body };
    }
  };
  vm.runInNewContext(code, context);
  const render = () => {
    cursor = refCursor = 0;
    return context.exports.TossPaymentResult({ paymentKey: "mock-payment", orderId: "mock-order", amount: "20500" });
  };
  render();
  effect();
  await new Promise(setImmediate);
  const tree = render();
  assert.equal(state[0], expected, label);
  assert.equal(clears, expected === "success" ? 1 : 0, `${label}: cart clearing`);
  const nodes = [];
  function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") { nodes.push(node); walk(node.props?.children); }
  }
  walk(tree);
  if (expected === "review") {
    assert(!JSON.stringify(tree).includes("PAYMENT COMPLETE"));
    assert(!nodes.some(node => node.props?.href === "/checkout"));
    assert(nodes.some(node => node.props?.href === "/mypage"));
    assert(state[1].includes("다시 결제하지 마시고"));
  }
  effect();
  await new Promise(setImmediate);
  assert.equal(requests, 1, `${label}: no automatic re-confirmation`);
  console.log(`PASS ${label}`);
}

const paid = { ok: true, payment: { status: "paid", orderId: "mock-order" } };
await check("200 confirmed", 200, paid, "success");
await check("200 already confirmed", 200, { ...paid, payment: { ...paid.payment, alreadyConfirmed: true } }, "success");
await check("202 reconciliation", 202, { ok: false, code: "PAYMENT_RECONCILIATION_REQUIRED" }, "review");
await check("202 never final", 202, paid, "review");
await check("400 failure", 400, { ok: false, message: "승인 실패" }, "failed");
await check("500 failure", 500, { ok: false }, "failed");
await check("200 explicit failure", 200, { ok: false }, "failed");
await check("200 missing paid state", 200, { ok: true }, "failed");
await check("200 pending", 200, { ok: true, payment: { status: "processing" } }, "failed");
await check("200 null body", 200, null, "failed");
await check("network failure", 0, null, "failed", true);
