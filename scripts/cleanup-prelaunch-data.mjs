import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadProjectEnv } from "./lib/load-next-env.mjs";

loadProjectEnv();
const apply = process.argv.includes("--apply");
const confirmation = process.argv.find((value) => value.startsWith("--confirm="))?.slice(10);
if (apply && confirmation !== "SAFE-TEST-DATA-CLEANUP") throw new Error("Apply requires --confirm=SAFE-TEST-DATA-CLEANUP");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const required = async (promise, label) => { const { data, error, count } = await promise; if (error) throw new Error(`${label}: ${error.message}`); return { data: data || [], count }; };
const protectedProductSlugs = new Set(["tongyeong-conch", "tongyeong-triploid-oyster", "tongyeong-sea-eel", "mokpo-hairtail", "tongyeong-rock-octopus", "wando-live-abalone", "통영-아나고회", "완도-활전복", "hairtail"]);
const testOrderNumbers = new Set(["PADO-OPS-20260624080401", "STOCK-1782365298007", "PADO-20260710-9255EE8", "PADO-20260710-761450F", "PADO-20260710-E58F8D4", "PADO-20260710-A981093", "PADO-20260710-8CC7E95", "PADO-20260715-B0FFD18"]);
const protectedOrderNumbers = new Set(["PADO-20260623-2K1RL", "PADO-20260625-WJK88"]);
const products = (await required(db.from("products").select("*,product_options(*)").order("created_at"), "products")).data;
const orders = (await required(db.from("orders").select("*,order_items(*),payments(*),shipments(*)").order("created_at"), "orders")).data;
const testProducts = products.filter((row) => !protectedProductSlugs.has(row.slug));
const protectedProducts = products.filter((row) => protectedProductSlugs.has(row.slug));
const testOrders = orders.filter((row) => testOrderNumbers.has(row.order_no));
const protectedOrders = orders.filter((row) => protectedOrderNumbers.has(row.order_no));
if (products.length !== 460 || testProducts.length !== 451 || protectedProducts.length !== 9) throw new Error(`Product safety assertion failed: ${products.length}/${testProducts.length}/${protectedProducts.length}`);
if (orders.length !== 10 || testOrders.length !== 8 || protectedOrders.length !== 2) throw new Error(`Order safety assertion failed: ${orders.length}/${testOrders.length}/${protectedOrders.length}`);
const backupDir = path.join(process.cwd(), "reports", "prelaunch-backup");
await mkdir(backupDir, { recursive: true });
await writeFile(path.join(backupDir, "products-before-cleanup.json"), JSON.stringify({ createdAt: new Date().toISOString(), count: products.length, products }, null, 2));
await writeFile(path.join(backupDir, "orders-before-cleanup.json"), JSON.stringify({ createdAt: new Date().toISOString(), count: orders.length, orders }, null, 2));
const result = { mode: apply ? "apply" : "dry-run", backupDir, before: { products: products.length, testProducts: testProducts.length, protectedProducts: protectedProducts.length, orders: orders.length, testOrders: testOrders.length, protectedOrders: protectedOrders.length } };
if (apply) {
  const now = new Date().toISOString();
  for (let offset = 0; offset < testProducts.length; offset += 12) await Promise.all(testProducts.slice(offset, offset + 12).map(async (product) => {
    const detail = product.detail_json && typeof product.detail_json === "object" ? product.detail_json : {};
    const operationBase = detail.operation && typeof detail.operation === "object" ? detail.operation : {};
    const detailJson = { ...detail, operationState: "hidden", testData: true, operation: { ...operationBase, state: "hidden", deletedAt: now, deletedBy: "prelaunch-test-cleanup", changedAt: now, changedBy: "prelaunch-test-cleanup", testReason: "confirmed-test-data" } };
    const { error } = await db.from("products").update({ is_active: false, detail_json: detailJson }).eq("id", product.id);
    if (error) throw new Error(`soft delete ${product.slug}: ${error.message}`);
  }));
  const existingMarks = (await required(db.from("operation_logs").select("order_id").eq("event_type", "prelaunch.test_order"), "test order marks")).data;
  const marked = new Set(existingMarks.map((row) => row.order_id));
  const rows = testOrders.filter((row) => !marked.has(row.id)).map((order) => ({ order_id: order.id, event_type: "prelaunch.test_order", summary: "오픈 전 테스트 주문으로 분리", payload: { isTest: true, paymentRecord: false, orderNo: order.order_no, reason: "confirmed-test-order" }, actor: { type: "system", id: "prelaunch-test-cleanup" } }));
  if (rows.length) { const { error } = await db.from("operation_logs").insert(rows); if (error) throw new Error(`test order mark: ${error.message}`); }
  const afterProducts = (await required(db.from("products").select("id,slug,is_active,detail_json"), "products after")).data;
  const afterMarks = (await required(db.from("operation_logs").select("order_id").eq("event_type", "prelaunch.test_order"), "marks after")).data;
  const profiles = await required(db.from("profiles").select("id", { count: "exact", head: true }), "profiles");
  result.after = { totalProducts: afterProducts.length, activeProducts: afterProducts.filter((row) => row.is_active).length, hiddenTestProducts: afterProducts.filter((row) => row.detail_json?.testData === true && row.detail_json?.operationState === "hidden").length, preservedProducts: afterProducts.filter((row) => protectedProductSlugs.has(row.slug)).length, markedTestOrders: new Set(afterMarks.map((row) => row.order_id)).size, preservedOrders: protectedOrders.length, profiles: profiles.count ?? 0 };
}
console.log(JSON.stringify(result, null, 2));
