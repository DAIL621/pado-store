import fs from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { loadProjectEnv } from "./lib/load-next-env.mjs";

loadProjectEnv();

const read = (path) => fs.readFileSync(path, "utf8");
const checkout = read("app/checkout/page.tsx");
const modal = read("components/checkout/AddressBookModal.tsx");
const manager = read("components/mypage/AddressManager.tsx");
const listApi = read("app/api/addresses/route.ts");
const itemApi = read("app/api/addresses/[id]/route.ts");
const aliasApi = read("app/api/address/route.ts");
const ordersApi = read("app/api/orders/route.ts");
const migration = read("supabase/migrations/202607201300_address_book_production.sql");

for (const column of ["recipient_name", "address_detail", "delivery_memo", "is_default", "created_at", "updated_at"]) assert(migration.includes(column), `production migration is missing ${column}`);
assert(migration.includes("enforce_user_address_default") && migration.includes("promote_user_address_default_after_delete"), "default promotion triggers are missing");
assert(aliasApi.includes("GET, POST") && fs.existsSync("app/api/address/[id]/route.ts"), "singular address API is missing");
assert(listApi.includes("getUser()") && itemApi.includes('.eq("user_id", user.id)'), "API ownership checks are missing");
assert(modal.includes("기본배송지로 설정") && manager.includes("배송지 관리"), "address management UI is incomplete");
assert(checkout.includes("배송지 목록에 저장") && checkout.includes("새 배송지 입력") && checkout.includes("onDefaultLoaded={applyAddress}"), "checkout address integration is incomplete");
assert(ordersApi.includes("selectedAddressId") && ordersApi.includes('.eq("user_id", user.id)'), "order address ownership validation is missing");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) throw new Error("Supabase environment variables are required for live address verification");

const admin = createClient(url, service, { auth: { persistSession: false } });
const stamp = Date.now();
const password = `Pado!${stamp}Aa`;
const emails = [`address-a-${stamp}@example.invalid`, `address-b-${stamp}@example.invalid`];
const users = [];
const addressIds = [];
try {
  for (const email of emails) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    users.push(data.user);
  }
  const clients = [];
  for (const email of emails) {
    const client = createClient(url, anon, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    clients.push(client);
  }
  const a = clients[0];
  const insert = async (label) => {
    const { data, error } = await a.from("user_addresses").insert({ user_id: users[0].id, label, recipient_name: "주소록 검증", phone: "010-0000-0000", zipcode: "00000", address: "테스트 주소", address_detail: "검증 후 삭제", delivery_memo: "문 앞" }).select().single();
    if (error) throw error; addressIds.push(data.id); return data;
  };
  const first = await insert("검증 배송지 1");
  assert.equal(first.is_default, true, "first address must become default");
  const second = await insert("검증 배송지 2");
  const { error: defaultError } = await a.from("user_addresses").update({ is_default: true }).eq("id", second.id);
  if (defaultError) throw defaultError;
  const { data: defaults } = await a.from("user_addresses").select("id,is_default").eq("is_default", true);
  assert.deepEqual(defaults?.map((row) => row.id), [second.id], "only one default is allowed");
  const { data: foreignRows } = await clients[1].from("user_addresses").select("id").eq("id", second.id);
  assert.equal(foreignRows?.length, 0, "RLS exposed another user's address");
  const { error: deleteError } = await a.from("user_addresses").delete().eq("id", second.id); if (deleteError) throw deleteError;
  addressIds.splice(addressIds.indexOf(second.id), 1);
  const { data: promoted } = await a.from("user_addresses").select("is_default").eq("id", first.id).single();
  assert.equal(promoted?.is_default, true, "oldest remaining address was not promoted");
  console.log(JSON.stringify({ ok: true, checks: ["migration", "create", "single-default", "default-change", "delete-promotion", "ownership-rls", "mypage", "checkout", "order-ownership"] }, null, 2));
} finally {
  if (users[0]) await admin.from("user_addresses").delete().eq("user_id", users[0].id);
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
}
