import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { adminFailureStatus } from "../lib/auth/authorization.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const adminRoutes = walk("app/api/admin").filter((file) => file.endsWith("route.ts"));
for (const route of adminRoutes) assert(read(route).includes("requireAdminApi"), `${route} does not use requireAdminApi`);
const adminPages = walk("app/admin").filter((file) => file.endsWith("page.tsx"));
for (const page of adminPages) assert(read(page).includes("getAdminSession"), `${page} does not protect the admin page`);

const envRefs = walk("app").concat(walk("components"), walk("lib")).filter((file) => /\.(ts|tsx)$/.test(file)).flatMap((file) => [...read(file).matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((match) => ({ file, key: match[1] })));
const allowedPublic = new Set(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY", "NEXT_PUBLIC_KAKAO_CLIENT_ID", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_ADMIN_SUBMIT_DEBUG"]);
for (const ref of envRefs.filter(({ key }) => key.startsWith("NEXT_PUBLIC_"))) assert(allowedPublic.has(ref.key), `unexpected public environment variable ${ref.key} in ${ref.file}`);
for (const secret of ["SUPABASE_SERVICE_ROLE_KEY", "TOSS_PAYMENTS_SECRET_KEY", "OPENAI_API_KEY", "DEV_ADMIN_PASSWORD"]) {
  assert(!envRefs.some(({ file, key }) => key === secret && file.startsWith("components")), `${secret} is referenced by a client component`);
}

const migration = read("supabase/migrations/202607201700_security_foundation.sql");
for (const table of ["profiles", "products", "product_options", "orders", "order_items", "payments", "shipments"]) assert(migration.includes(`alter table public.${table} enable row level security`), `RLS missing for ${table}`);
for (const rule of ["products_public_read_active", "orders_owner_read", "payments_owner_read", "shipments_owner_read", "products_admin_manage"]) assert(migration.includes(rule), `RLS policy missing: ${rule}`);

const admin = read("lib/auth/admin-api.ts");
const devAdmin = read("lib/auth/dev-admin.ts");
const config = read("next.config.ts");
const request = read("lib/api/request.ts");
const health = read("app/api/health/route.ts");
const confirm = read("app/api/payments/toss/confirm/route.ts");
const webhook = read("app/api/payments/toss/webhook/route.ts");
const roleMigration = read("supabase/migrations/202607211000_profile_user_admin_roles.sql");
const addressMigration = read("supabase/migrations/202607201300_address_book_production.sql");
const callback = read("app/auth/callback/route.ts");
const header = read("components/layout/Header.tsx");
assert(admin.includes("getAdminSession") && admin.includes("adminFailureStatus(session.reason)"), "admin auth enforcement missing");
assert.equal(adminFailureStatus("not-admin"), 403, "ordinary user must receive 403 from admin API");
assert.equal(adminFailureStatus("not-logged-in"), 401, "anonymous user must receive 401 from admin API");
assert.equal(adminFailureStatus("missing-env"), 503, "missing server configuration must fail closed");
assert(roleMigration.includes("set role = 'user' where role = 'customer'") && roleMigration.includes("default 'user'") && roleMigration.includes("revoke update (role)"), "user/admin role migration is incomplete");
assert(addressMigration.includes("create table if not exists public.user_addresses") && addressMigration.includes("enable row level security") && addressMigration.includes("auth.uid() = user_id"), "user_addresses table or RLS migration is missing");
assert(callback.includes('role: "user"') && !callback.includes('role: "customer"'), "OAuth callback does not create user role");
assert(header.includes('process.env.NODE_ENV !== "production"') && header.includes("role: {role}"), "development role indicator is missing");
assert(devAdmin.includes('process.env.NODE_ENV !== "production"'), "dev admin is not production-disabled");
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options", "Content-Security-Policy"]) assert(config.includes(header), `security header missing: ${header}`);
assert(request.includes("maxBytes") && request.includes("status: 413"), "JSON request size validation missing");
assert(!health.includes("supabaseServiceRole") && !health.includes("tossSecretKey"), "health route leaks secret configuration state");
assert(confirm.includes("total_amount") && confirm.includes("alreadyPaid") && confirm.includes("paymentAmount"), "payment amount/idempotency checks missing");
assert(webhook.includes("allowedEvents") && webhook.includes("일치하는 결제를 찾을 수 없습니다"), "webhook allowlist/order binding missing");

console.log(JSON.stringify({ ok: true, checks: { adminRoutes: adminRoutes.length, adminPages: adminPages.length, authorization: { admin: 200, user: 403, anonymous: 401 }, roles: ["user", "admin"], rlsTables: 7, publicEnvAllowlist: [...allowedPublic], headers: 5, payment: ["server-amount", "duplicate-confirm", "webhook-allowlist"] } }, null, 2));
