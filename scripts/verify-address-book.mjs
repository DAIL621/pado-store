import fs from "node:fs";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(path, "utf8");
const checkout = read("app/checkout/page.tsx");
const modal = read("components/checkout/AddressBookModal.tsx");
const listApi = read("app/api/addresses/route.ts");
const itemApi = read("app/api/addresses/[id]/route.ts");
const migration = read("supabase/migrations/202607171100_user_addresses.sql");
const css = read("app/globals.css");

for (const column of ["user_id", "label", "recipient", "phone", "zipcode", "detail_address", "memo", "is_default", "is_gift", "last_used_at", "created_at", "updated_at"]) {
  assert(migration.includes(column), `migration is missing ${column}`);
}
assert(migration.includes("enable row level security") && migration.includes("auth.uid() = user_id"), "address RLS is missing");
assert(migration.includes("user_addresses_one_default_idx"), "one-default-address constraint is missing");
assert(listApi.includes(".order(\"last_used_at\"") && listApi.includes("is_default"), "recent/default address ordering is missing");
assert(itemApi.includes("markUsed") && itemApi.includes("last_used_at"), "recent use update is missing");
assert(itemApi.includes("export async function DELETE") && itemApi.includes("export async function PATCH"), "address update/delete API is missing");
for (const label of ["저장된 배송지", "+ 배송지 추가", "배송지 수정", "기본 배송지로 설정", "선물입니다", "배송메모", "선택"]) {
  assert(modal.includes(label), `address modal is missing ${label}`);
}
assert(checkout.includes("onDefaultLoaded={applyAddress}"), "default address auto selection is missing");
assert(checkout.includes("checkout-selected-address") && checkout.includes("deliverySelection"), "checkout address summary or gift structure is missing");
assert(css.includes("address-card-list") && css.includes("@media(max-width:768px)"), "responsive address card styles are missing");

console.log(JSON.stringify({ ok: true, checks: ["address-crud", "ownership-rls", "single-default", "recent-order", "auto-fill", "gift-structure", "summary", "mobile-cards"] }, null, 2));
