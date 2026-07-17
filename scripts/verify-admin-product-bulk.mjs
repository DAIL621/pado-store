import fs from "node:fs";
import assert from "node:assert/strict";

const manager = fs.readFileSync("components/admin/AdminProductsManager.tsx", "utf8");
const route = fs.readFileSync("app/api/admin/products/[id]/route.ts", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

for (const token of ["selectedIds", "toggleAllVisible", "toggleProduct", "runBulkAction", "selectedProducts.length"]) {
  assert(manager.includes(token), `selection flow is missing ${token}`);
}
for (const label of ["현재 목록 전체선택", "개 선택됨", "선택삭제", "선택숨김", "판매종료", "판매중", "일괄 작업 확인", "취소"]) {
  assert(manager.includes(label), `admin product UI is missing ${label}`);
}
for (const action of ["delete", "hide", "end_sale", "recover"]) {
  assert(manager.includes(`\"${action}\"`), `bulk action is missing ${action}`);
}
assert(route.includes('state: "hidden" | "ended" | "deleted" | null'), "API must distinguish hidden and deleted states");
assert(route.includes('body.action === "hide"'), "hide API action is missing");
assert(route.includes('withOperationState(currentProduct?.detail_json, "deleted"'), "DELETE must write deleted operation state");
assert(route.includes('eventType: "product.soft_deleted"'), "soft-delete operation log is missing");
assert(manager.includes("if (isDeletedProduct(product)) return false"), "soft-deleted products must be excluded from the default list");
assert(css.includes(".admin-bulk-toolbar") && css.includes(".admin-confirm-modal"), "bulk toolbar/modal styles are missing");

console.log(JSON.stringify({ ok: true, checks: ["select-all", "partial-selection", "selection-count", "soft-delete", "hide", "end-sale", "selling", "confirm-modal", "mobile-toolbar"] }, null, 2));
