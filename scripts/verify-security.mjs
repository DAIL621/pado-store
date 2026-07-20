import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const read = (file) => fs.readFileSync(file, "utf8");
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const adminRoutes = walk("app/api/admin").filter((file) => file.endsWith("route.ts"));
for (const route of adminRoutes) assert(read(route).includes("requireAdminApi"), `${route} does not use requireAdminApi`);

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
assert(admin.includes("getAdminSession") && admin.includes("status: session.reason === \"not-logged-in\" ? 401 : 403"), "admin 401/403 enforcement missing");
assert(devAdmin.includes('process.env.NODE_ENV !== "production"'), "dev admin is not production-disabled");
for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options", "Content-Security-Policy"]) assert(config.includes(header), `security header missing: ${header}`);
assert(request.includes("maxBytes") && request.includes("status: 413"), "JSON request size validation missing");
assert(!health.includes("supabaseServiceRole") && !health.includes("tossSecretKey"), "health route leaks secret configuration state");
assert(confirm.includes("total_amount") && confirm.includes("alreadyPaid") && confirm.includes("paymentAmount"), "payment amount/idempotency checks missing");
assert(webhook.includes("allowedEvents") && webhook.includes("일치하는 결제를 찾을 수 없습니다"), "webhook allowlist/order binding missing");

console.log(JSON.stringify({ ok: true, checks: { adminRoutes: adminRoutes.length, rlsTables: 7, publicEnvAllowlist: [...allowedPublic], headers: 5, payment: ["server-amount", "duplicate-confirm", "webhook-allowlist"] } }, null, 2));
