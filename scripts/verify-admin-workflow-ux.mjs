import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const orders = read("components/admin/AdminOrdersManager.tsx");
const deliveries = read("components/admin/AdminDeliveriesManager.tsx");
const customers = read("components/admin/AdminCustomersManager.tsx");
const cs = read("components/admin/AdminCsManager.tsx");
const products = read("components/admin/AdminProductsManager.tsx");
const status = read("lib/operations/status.ts");
const all = [orders, deliveries, customers, cs, products].join("\n");

const checks = [
  ["duplicate submit guards", [orders, deliveries, customers, cs].every(source => source.includes("saving") || source.includes("working"))],
  ["shipment enter save", deliveries.includes('event.key === "Enter"') && deliveries.includes("saveAndFocusNext")],
  ["focus only after success", orders.includes("if (!saved) return") && deliveries.includes("if (saved && next)")],
  ["row errors preserved", orders.includes("rowErrors") && deliveries.includes("rowErrors")],
  ["unsaved departure warning", deliveries.includes("beforeunload") && deliveries.includes("dirtyIds")],
  ["saved row feedback", orders.includes("admin-row-saved") && deliveries.includes("admin-row-saved")],
  ["shared toast feedback", [orders, deliveries, customers, cs].every(source => source.includes("<AdminToast"))],
  ["url query state", [orders, customers, cs, products].every(source => source.includes("URLSearchParams") && source.includes("router.replace"))],
  ["textarea enter safe", !/textarea[^>]+onKeyDown/.test(all)],
  ["zero and error separated", customers.includes('"loading" | "ready" | "error"') && cs.includes('"loading" | "ready" | "error"')],
  ["quick filter and summary", orders.includes("admin-order-summary-cards") && orders.includes('range: "today"') && orders.includes('shipping: "none"')],
  ["transition policy", status.includes("orderStatusFlow") && orders.includes("canChangeOrderStatus") && deliveries.includes("canChangeOrderStatus")],
  ["bulk selection count", orders.includes("selectedIds.length") && orders.includes("result.failed")],
  ["contextual cs only", !cs.includes("+ CS 접수") && customers.includes('action: "cs"') && orders.includes("CS 조회·접수")],
  ["no browser alert", !/\b(?:window\.)?alert\s*\(/.test(all)],
  ["design system reuse", [orders, deliveries, customers, cs].every(source => source.includes("@/components/admin/ui"))],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length) { console.error(JSON.stringify({ ok: false, failures }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok: true, checks: checks.map(([name]) => name) }, null, 2));
