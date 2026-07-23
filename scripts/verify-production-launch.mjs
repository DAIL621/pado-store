import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const args = new Map(
  process.argv
    .slice(2)
    .map((arg) => {
      const [key, ...rest] = arg.replace(/^--/, "").split("=");
      return [key, rest.join("=") || "true"];
    })
);

const productionUrl = args.get("url") || process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
const strict = args.get("strict") === "true";

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function parseEnvFile(file) {
  const env = {};
  read(file)
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index < 0) return;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      env[key] = value;
    });
  return env;
}

const fileEnv = { ...parseEnvFile(".env.local"), ...parseEnvFile(".env.production.local") };
const env = { ...fileEnv, ...process.env };

function isPresent(value) {
  return Boolean(value && !String(value).startsWith("YOUR_") && String(value) !== "CHANGE_THIS_TEMP_PASSWORD");
}

function isProductionUrl(value) {
  return /^https:\/\//.test(String(value || "")) && !/localhost|127\.0\.0\.1|YOUR_DOMAIN/i.test(String(value || ""));
}

function check(name, ok, detail, weight = 1, critical = false) {
  return { name, ok: Boolean(ok), detail, weight, critical };
}

function get(url, timeoutMs = 10000) {
  return new Promise((resolve) => {
    if (!url || !/^https?:\/\//.test(url)) {
      resolve({ ok: false, status: 0, body: "", error: "invalid url" });
      return;
    }
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 300000) req.destroy();
      });
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, body }));
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: "", error: "timeout" });
    });
    req.on("error", (error) => resolve({ ok: false, status: 0, body: "", error: error.message }));
  });
}

const migration = read("supabase/migrations/202607060400_operation_automation.sql");
const verificationSql = read("supabase/phase10-production-verification.sql");
const healthRoute = read("app/api/health/route.ts");
const sitemap = read("app/sitemap.ts");
const robots = read("app/robots.ts");
const confirmRoute = read("app/api/payments/toss/confirm/route.ts");
const refundRoute = read("app/api/admin/payments/refund/route.ts");
const webhookRoute = read("app/api/payments/toss/webhook/route.ts");
const runbook = read("PHASE10_PRODUCTION_LAUNCH.md");
const envExample = read(".env.example");
const storageHelper = read("lib/admin/image-storage.ts");
const uploadRoute = read("app/api/admin/uploads/route.ts");
const productDetailModel = read("lib/products/detail.ts");
const productDetailTemplate = read("components/products/ProductDetailTemplate.tsx");
const productDetailEditor = read("components/admin/ProductDetailEditor.tsx");
const authCallbackRoute = read("app/auth/callback/route.ts");
const setAdminSql = read("supabase/set-admin.sql");
const schemaSql = read("supabase/schema.sql");

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY",
  "TOSS_PAYMENTS_SECRET_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_KAKAO_CLIENT_ID"
];

const storageMode = env.PADO_PRODUCT_IMAGE_STORAGE || "local";
const notificationProvider = env.PADO_NOTIFICATION_PROVIDER || "mock";
const siteUrl = env.NEXT_PUBLIC_SITE_URL || productionUrl;
const redirectUrls = {
  kakaoRedirectUri: `${siteUrl}/auth/callback`,
  supabaseRedirectUrl: `${siteUrl}/auth/callback`,
  tossSuccessUrl: `${siteUrl}/payments/toss/success`,
  tossFailUrl: `${siteUrl}/payments/toss/fail`,
  tossWebhookUrl: `${siteUrl}/api/payments/toss/webhook`,
  healthUrl: `${siteUrl}/api/health`,
  robotsUrl: `${siteUrl}/robots.txt`,
  sitemapUrl: `${siteUrl}/sitemap.xml`
};

const checks = [];

requiredEnv.forEach((key) => checks.push(check(`env:${key}`, isPresent(env[key]), isPresent(env[key]) ? "set" : "missing", 3, true)));
checks.push(check("env:DEV_ADMIN_LOGIN_ENABLED=false", env.DEV_ADMIN_LOGIN_ENABLED !== "true", `value=${env.DEV_ADMIN_LOGIN_ENABLED ?? "(unset)"}`, 4, true));
checks.push(check("env:NEXT_PUBLIC_SITE_URL is production https", isProductionUrl(siteUrl), siteUrl || "missing", 4, true));
checks.push(check("storage:supabase mode for production", storageMode === "supabase", `PADO_PRODUCT_IMAGE_STORAGE=${storageMode}`, 2, false));
checks.push(check("storage:bucket env", storageMode !== "supabase" || isPresent(env.SUPABASE_PRODUCT_IMAGE_BUCKET), env.SUPABASE_PRODUCT_IMAGE_BUCKET || "not set", 2, storageMode === "supabase"));
checks.push(check("notification:provider selected", isPresent(notificationProvider), notificationProvider, 1, false));
checks.push(check("notification:not mock for full launch", notificationProvider !== "mock", `PADO_NOTIFICATION_PROVIDER=${notificationProvider}`, 1, false));

["operation_logs", "order_status_history", "notification_events", "review_requests", "inventory_logs"].forEach((table) => {
  checks.push(check(`migration:${table}`, migration.includes(`create table if not exists ${table}`), "migration includes table", 2, true));
  checks.push(check(`verification-sql:${table}`, verificationSql.includes(table), "verification SQL includes table", 1, true));
});
checks.push(check("migration:RLS", migration.includes("enable row level security") && migration.includes("public.is_admin()"), "RLS and admin policy present", 3, true));
checks.push(check("migration:indexes", migration.includes("create index if not exists"), "indexes present", 2, true));
checks.push(check("migration:triggers", migration.includes("create trigger") && migration.includes("set_updated_at"), "updated_at triggers present", 2, true));
checks.push(check("migration:foreign-keys", migration.includes("references orders") && migration.includes("references product_options"), "foreign keys present", 2, true));
["delivery_ready", "return_requested", "returned", "refunded"].forEach((status) => {
  checks.push(check(`migration:orders_status_check:${status}`, migration.includes(`'${status}'`), `orders status supports ${status}`, 2, true));
  checks.push(check(`schema:orders_status_check:${status}`, schemaSql.includes(`'${status}'`), `base schema supports ${status}`, 1, true));
  checks.push(check(`verification-sql:orders_status_check:${status}`, verificationSql.includes(`('${status}')`), `verification SQL checks ${status}`, 1, true));
});
checks.push(check("verification-sql:products.detail_json", verificationSql.includes("column_name = 'detail_json'"), "products.detail_json column check present", 2, true));
checks.push(check("verification-sql:legacy-detail-json", verificationSql.includes("legacyDetailImages") && verificationSql.includes("detailDisplayMode"), "legacy detail JSON structure check present", 2, true));
checks.push(check("verification-sql:storage-bucket", verificationSql.includes("storage.buckets") && verificationSql.includes("product-images"), "Supabase Storage bucket check present", 1, false));

checks.push(check("health:env checks", healthRoute.includes("tossSecretKey") && healthRoute.includes("devAdminLoginDisabled"), "health route checks critical env", 2, true));
checks.push(check("seo:sitemap route", sitemap.includes("NEXT_PUBLIC_SITE_URL") && sitemap.includes("/products"), "sitemap route uses site URL and product URLs", 2, true));
checks.push(check("seo:robots route", robots.includes("sitemap") && robots.includes("disallow"), "robots route includes sitemap and admin disallow", 2, true));
checks.push(check("toss:confirm route", confirmRoute.includes("api.tosspayments.com") && confirmRoute.includes("payment_approved"), "Toss confirm and operation log present", 3, true));
checks.push(check("toss:duplicate-confirm guard", confirmRoute.includes("alreadyConfirmed") && confirmRoute.includes("pado_claim_payment_v2"), "duplicate payment approval returns idempotent success", 2, true));
checks.push(check("toss:failure handling", confirmRoute.includes("pado_fail_payment_v2") && confirmRoute.includes("PAYMENT_RECONCILIATION_REQUIRED"), "Toss failure is persisted or reconciled", 2, true));
checks.push(check("toss:inventory logging", confirmRoute.includes("pado_finalize_payment_v2"), "payment approval writes inventory ledger atomically", 2, true));
checks.push(check("toss:refund route", refundRoute.includes("cancel") && refundRoute.includes("refund_completed"), "Toss refund and stock restore path present", 3, true));
checks.push(check("toss:refund stock restore", refundRoute.includes("stockRestoreQuantity") && refundRoute.includes("pado_finalize_refund_v2"), "refund restores selected inventory atomically", 2, true));
checks.push(check("toss:webhook route", webhookRoute.includes("payment_events") && webhookRoute.includes("tosspayments-webhook-transmission-id"), "Toss webhook verification and deduplication present", 2, true));
checks.push(check("kakao:auth callback profile", authCallbackRoute.includes("profiles") && authCallbackRoute.includes("role: \"user\""), "Kakao/Supabase callback creates user profile", 2, true));
checks.push(check("kakao:admin role sql", setAdminSql.includes("set role = 'admin'") && setAdminSql.includes("profiles"), "admin role promotion SQL documented", 1, true));
checks.push(check("storage:env example", envExample.includes("PADO_PRODUCT_IMAGE_STORAGE=supabase") && envExample.includes("SUPABASE_PRODUCT_IMAGE_BUCKET=product-images"), "Storage production env documented", 1, true));
checks.push(check("storage:upload helper", storageHelper.includes("client.storage.from(bucket).upload") && storageHelper.includes("getPublicUrl"), "Supabase Storage upload and public URL path present", 2, true));
checks.push(check("storage:admin upload route", uploadRoute.includes("uploadAdminProductImage") && uploadRoute.includes("requireAdminApi"), "admin upload route requires admin and uses storage helper", 2, true));
checks.push(check("detail-json:legacy model", productDetailModel.includes("detailDisplayMode") && productDetailModel.includes("legacyDetailImages"), "legacy detail image fields exist in detail model", 2, true));
checks.push(check("detail-json:legacy editor", productDetailEditor.includes("legacyDetailImages") && productDetailEditor.includes("uploadLegacyFiles"), "admin editor supports legacy detail uploads", 2, true));
checks.push(check("detail-json:legacy renderer", productDetailTemplate.includes('data-template-kind="legacy"') && productDetailTemplate.includes("legacy-detail-pages"), "customer detail page renders legacy detail images first", 2, true));
checks.push(check("runbook:go no-go", runbook.includes("Go / No-Go") && runbook.includes("Top 10"), "runbook has launch decision and critical tasks", 2, true));
checks.push(check("runbook:toss rehearsal", runbook.includes("Toss Real Payment / Refund Rehearsal"), "Toss real-payment/refund rehearsal documented", 2, true));
checks.push(check("runbook:redirect checklist", runbook.includes("Redirect URL Checklist"), "Kakao/Supabase/Toss redirect checklist documented", 2, true));
checks.push(check("runbook:storage checklist", runbook.includes("Supabase Storage Production Bucket Checklist"), "Supabase Storage production checklist documented", 2, true));

Object.entries(redirectUrls).forEach(([key, value]) => {
  checks.push(check(`redirect:${key}`, isProductionUrl(value), value, 1, key.includes("toss") || key.includes("kakao")));
});

const remoteResults = [];
if (isProductionUrl(productionUrl)) {
  const [health, robotsResult, sitemapResult, home] = await Promise.all([
    get(redirectUrls.healthUrl),
    get(redirectUrls.robotsUrl),
    get(redirectUrls.sitemapUrl),
    get(siteUrl)
  ]);
  remoteResults.push({ target: "health", ...health });
  remoteResults.push({ target: "robots", ...robotsResult });
  remoteResults.push({ target: "sitemap", ...sitemapResult });
  remoteResults.push({ target: "home", ...home });
  checks.push(check("remote:/api/health", health.ok && health.body.includes('"status":"ok"'), `status=${health.status}${health.error ? ` error=${health.error}` : ""}`, 4, true));
  checks.push(check("remote:/robots.txt", robotsResult.ok && robotsResult.body.includes("Sitemap"), `status=${robotsResult.status}`, 2, true));
  checks.push(check("remote:/sitemap.xml", sitemapResult.ok && sitemapResult.body.includes("<urlset"), `status=${sitemapResult.status}`, 2, true));
  checks.push(check("remote:metadata", home.ok && /<title|og:|application\/ld\+json/i.test(home.body), `status=${home.status}`, 2, false));
} else {
  checks.push(check("remote:production-url-provided", false, "pass --url=https://your-domain to verify live robots/sitemap/metadata/SSL", 0, false));
}

const possible = checks.reduce((sum, item) => sum + item.weight, 0);
const earned = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
const readiness = possible > 0 ? Math.round((earned / possible) * 100) : 0;
const criticalFailures = checks.filter((item) => item.critical && !item.ok);
const go = readiness >= 95 && criticalFailures.length === 0;

const result = {
  ok: go || !strict,
  goNoGo: go ? "Go" : "Conditional Go",
  readiness,
  productionReadiness: readiness,
  criticalFailures: criticalFailures.map((item) => ({ name: item.name, detail: item.detail })),
  blockers: checks.filter((item) => !item.ok).map((item) => ({ name: item.name, detail: item.detail, critical: item.critical })),
  redirectUrls,
  remoteResults,
  checks
};

console.log(JSON.stringify(result, null, 2));

if (strict && !go) {
  process.exitCode = 1;
}
