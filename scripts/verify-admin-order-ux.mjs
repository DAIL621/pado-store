import fs from "node:fs";
import assert from "node:assert/strict";
import { adminFailureStatus } from "../lib/auth/authorization.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const manager = read("components/admin/AdminOrdersManager.tsx");
const listApi = read("app/api/admin/orders/route.ts");
const itemApi = read("app/api/admin/orders/[id]/route.ts");
const mypage = read("app/mypage/page.tsx");
const tracking = read("lib/shipping/tracking-url.ts");
const css = read("app/admin-orders-ux.css");

assert.equal(adminFailureStatus("not-logged-in"), 401);
assert.equal(adminFailureStatus("not-admin"), 403);
assert(listApi.includes("requireAdminApi") && itemApi.includes("requireAdminApi"), "admin authorization is missing");
for (const key of ["q", "status", "shipping", "payment", "range", "dateFrom", "dateTo", "sort", "page", "pageSize"]) assert(listApi.includes(`get("${key}")`) || manager.includes(`"${key}"`), `missing URL filter: ${key}`);
for (const field of ["order_no", "recipient_name", "recipient_phone", "product_name", "option_name", "tracking_number", "profiles"]) assert(listApi.includes(field), `integrated search missing: ${field}`);
assert(listApi.includes('{ count: "exact" }') && listApi.includes(".range(from, from + pageSize - 1)"), "server pagination is missing");
assert(manager.includes("router.replace") && manager.includes("URLSearchParams"), "URL state is missing");
assert(manager.includes("saveShipment") && manager.includes("resolveTrackingSaveStatus"), "inline shipment save is missing");
assert(manager.includes("bulkStatus") && listApi.includes("order.bulk_status_changed") && listApi.includes("needsTrackingNumber"), "safe bulk status processing is missing");
assert(itemApi.includes("order.internal_note") && manager.includes("internalNote") && manager.includes("고객 화면에는 노출되지 않습니다"), "private order note is missing");
assert(manager.includes("오늘 출고") && manager.includes("배송 지연") && manager.includes("송장 미입력") && manager.includes("취소 요청") && manager.includes("환불 진행"), "urgency badges are missing");
assert(manager.includes("admin-order-cs-head") && manager.includes("배송·고객 정보") && manager.includes("주문상품·결제"), "CS summary or detail layout is missing");
assert(tracking.includes("trace.cjlogistics.com") && manager.includes("buildTrackingUrl") && mypage.includes("buildTrackingUrl"), "shared tracking link is missing");
assert(css.includes("admin-order-status.paid") && css.includes("admin-order-status.refunded") && css.includes("@media(max-width:700px)"), "status tokens or responsive layout are missing");
assert(manager.includes('event.key === "Escape"') && css.includes(":focus-visible"), "keyboard accessibility is missing");

console.log(JSON.stringify({ ok: true, checks: ["auth-401-403", "integrated-search", "combined-filters", "server-pagination", "url-state", "inline-tracking", "safe-bulk-status", "private-note-audit", "urgency-badges", "cs-summary", "detail-layout", "tracking-link", "status-colors", "responsive", "keyboard"] }, null, 2));
