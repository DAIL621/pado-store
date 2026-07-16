import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "./lib/load-next-env.mjs";

loadProjectEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase admin environment is missing.");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const required = async (promise, label) => { const { data, error } = await promise; if (error) throw new Error(`${label}: ${error.message}`); return data || []; };

const products = await required(db.from("products").select("id,slug,name,origin,category,is_active,created_at,product_options(id)").order("created_at", { ascending: true }), "products");
const orders = await required(db.from("orders").select("id,order_no,status,created_at,recipient_name,memo,payments(status,amount,approved_at),order_items(product_slug,product_name,option_name,quantity,unit_price)").order("created_at", { ascending: true }), "orders");

const definiteProductPattern = /(verification|admin-edit|admin-click|detail-auto|ops-db-test|ops-state-test|stock-check|supabase-test|video-policy-test|pado-e2e-product|duplicate-slug-base|private-detail|legacy-detail|wando-live-abalone-test|테스트|검증)/i;
const diagnosticProductPattern = /(diagnose|debug)/i;
const originalTestPattern = /(verification|admin-edit|detail-auto|ops-db-test|stock-check|test|e2e|duplicate|private-detail|private detail|legacy-detail|legacy detail|테스트|검증)/i;
const productSignals = (row) => `${row.slug} ${row.name} ${row.origin} ${row.category}`;
const definiteTests = products.filter((row) => definiteProductPattern.test(productSignals(row)) || diagnosticProductPattern.test(productSignals(row)));
const candidates = products.filter((row) => !definiteTests.includes(row));
const originalCandidates = products.filter((row) => !originalTestPattern.test(productSignals(row)));

const orderEvidence = (row) => {
  const combined = `${row.order_no || ""} ${row.recipient_name || ""} ${row.memo || ""}`;
  if (/^STOCK-|^PADO-OPS-|런칭리허설|verification|test|테스트|검증|e2e/i.test(combined)) return "테스트 표식 있음";
  return "테스트 표식 없음 — 실제 주문 확정 불가";
};

console.log(JSON.stringify({
  summary: { totalProducts: products.length, definiteTestProducts: definiteTests.length, operationCandidates: candidates.length, totalOrders: orders.length, definiteTestOrders: orders.filter((row) => orderEvidence(row) === "테스트 표식 있음").length },
  operationCandidates: candidates.map((row) => ({ name: row.name, slug: row.slug, createdAt: row.created_at, active: row.is_active, optionCount: row.product_options?.length || 0 })),
  originalElevenCandidates: originalCandidates.map((row) => ({ name: row.name, slug: row.slug, createdAt: row.created_at, active: row.is_active, optionCount: row.product_options?.length || 0 })),
  orders: orders.map((row) => ({ orderNo: row.order_no, createdAt: row.created_at, orderStatus: row.status, paymentStatus: row.payments?.[0]?.status || "결제 레코드 없음", paymentApprovedAt: row.payments?.[0]?.approved_at || null, classification: orderEvidence(row), items: row.order_items?.map((item) => ({ productSlug: item.product_slug, productName: item.product_name, optionName: item.option_name, quantity: item.quantity, unitPrice: item.unit_price })) || [] })),
  classificationRule: { definiteProductPattern: definiteProductPattern.source, diagnosticProductPattern: diagnosticProductPattern.source, orderRule: "주문번호·수령인명·메모에 런칭리허설/verification/test/테스트/검증/e2e 표식이 있으면 테스트" }
}, null, 2));
