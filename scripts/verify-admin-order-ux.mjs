import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(path, "utf8");
const admin = read("components/admin/AdminOrdersManager.tsx");
const mypage = read("app/mypage/page.tsx");
const tracking = read("lib/shipping/tracking-url.ts");
const css = read("app/globals.css");
const status = read("lib/operations/status.ts");

for (const section of ["주문정보", "배송 관리", "주문상품"]) assert(admin.includes(section), `missing ${section} section`);
assert(admin.includes("autoShipOnTracking") && admin.includes("resolveTrackingSaveStatus"), "automatic tracking transition is missing");
assert(admin.includes("송장 저장 시 다음 배송 단계로 자동 변경") && admin.includes("useState(true)"), "auto-shipping default toggle is missing");
assert(status.includes('persistedStatus === "paid"') && status.includes('? "preparing"') && status.includes('? "shipped"'), "paid/preparing tracking transition policy is missing");
assert(status.includes("canChangeOrderStatus(persistedStatus, automaticTarget)"), "automatic transition must use backend status policy");
assert(admin.includes("송장 복사") && admin.includes("저장되었습니다."), "tracking copy or save toast is missing");
assert(admin.includes("admin-order-modal-actions") && admin.includes(">취소</button>") && admin.includes('"저장"'), "right-aligned modal actions are missing");
assert(admin.includes("admin-order-progress") && admin.includes('aria-current={status === step ? "step"'), "order progress is missing");
assert(tracking.includes("trace.cjlogistics.com") && admin.includes("buildTrackingUrl") && mypage.includes("buildTrackingUrl"), "shared tracking link is missing");
assert(mypage.includes("배송조회") && mypage.includes("trackingHref!"), "mypage tracking button is missing");
assert(css.includes("admin-shipping-form") && css.includes("@media(max-width:600px)"), "responsive order modal styles are missing");

console.log(JSON.stringify({ ok: true, checks: ["three-cards", "tracking-copy", "auto-shipped", "save-toast", "tracking-link", "mypage-link", "progress", "responsive"] }, null, 2));
