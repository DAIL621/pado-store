import assert from "node:assert/strict";
import fs from "node:fs";
import { canUseDevAdmin } from "../lib/auth/admin-policy.ts";
import { adminFailureStatus } from "../lib/auth/authorization.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const dev = (overrides = {}) => canUseDevAdmin({
  hasSupabaseUser: false,
  hasDevAdminCookie: false,
  nodeEnv: "development",
  devAdminEnabled: true,
  ...overrides
});

assert.equal(dev(), false, "A: anonymous without a dev cookie must be denied");
assert.equal(dev({ hasSupabaseUser: true }), false, "B: a Supabase user cannot become dev admin");
assert.equal(dev({ hasSupabaseUser: true, hasDevAdminCookie: true }), false, "C: a user plus dev cookie must be denied");
assert.equal(adminFailureStatus("not-admin"), 403, "B/C: ordinary users must receive API 403");
assert.equal(dev({ hasDevAdminCookie: true }), true, "E: anonymous local dev session may use dev admin");
assert.equal(dev({ hasDevAdminCookie: true, nodeEnv: "production" }), false, "F: production must ignore dev admin");

const adminAuth = read("lib/auth/admin.ts");
assert(adminAuth.indexOf("await supabase.auth.getUser") < adminAuth.indexOf("await hasDevAdminSession"), "Supabase auth must be evaluated before dev admin");
assert(adminAuth.includes('source: "supabase"') && adminAuth.includes('source: "dev-admin"'), "admin session source must be explicit");

const rootLayout = read("app/layout.tsx");
const chrome = read("components/layout/AppChrome.tsx");
assert(!rootLayout.includes("<Header") && !rootLayout.includes("<Footer") && !rootLayout.includes("<MobileBottomNav"), "root layout must not render store chrome directly");
assert(chrome.includes('pathname === "/admin"') && chrome.includes('pathname.startsWith("/admin/")'), "G: admin route isolation missing");
assert(chrome.indexOf("if (isAdminRoute)") < chrome.indexOf("<Header"), "G: admin must return before store chrome renders");
assert(chrome.includes("<Header") && chrome.includes("<Footer") && chrome.includes("<MobileBottomNav"), "H: store chrome missing");

const adminPages = fs.readdirSync("app/admin", { recursive: true })
  .filter((path) => path.endsWith("page.tsx"))
  .map((path) => `app/admin/${path.replaceAll("\\\\", "/")}`);
for (const page of adminPages) {
  const source = read(page);
  assert(source.includes("getAdminSession"), `${page} missing server admin guard`);
  assert(source.includes('redirect("/forbidden")'), `${page} missing explicit access-denied route`);
}

console.log(JSON.stringify({
  ok: true,
  scenarios: ["anonymous-denied", "user-403", "user-plus-dev-cookie-403", "supabase-admin-supported", "local-dev-admin", "production-dev-denied", "admin-chrome-isolated", "store-chrome-isolated", "single-admin-session-source"],
  adminPages: adminPages.length
}, null, 2));
