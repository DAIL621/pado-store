import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(file, modules) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const context = { exports: {}, URL, window: { location: { origin: "https://pado-store-phi.vercel.app" } },
    process: { env: { DEV_ADMIN_PASSWORD: "mock" } },
    require(name) { assert(name in modules, `Unexpected dependency ${name}`); return modules[name]; }
  };
  vm.runInNewContext(code, context);
  return context.exports;
}

const helper = load("lib/auth/next-path.ts", {});
const { sanitizeNextPath } = helper;
const allowed = ["/", "/products", "/cart", "/checkout", "/mypage", "/admin", "/admin/orders",
  "/admin/products", "/products/hairtail?tab=detail#shipping", "/products?q=%ED%95%9C%EA%B8%80", "/products?q=hello%20world"];
const denied = [undefined, null, [], "", "https://evil.example.com", "http://evil.example.com",
  "//evil.example.com", "///evil.example.com", "javascript:alert(1)", "data:text/html,evil",
  "https%3A%2F%2Fevil.example.com", "%2F%2Fevil.example.com", "%252F%252Fevil.example.com",
  "/%2Fevil.example.com", "/%252Fevil.example.com", "/\\evil.example.com", "\\\\evil.example.com",
  "/%5Cevil.example.com", "/%255Cevil.example.com", "/\t/evil.example.com", "/%09/evil.example.com",
  "/%0d%0a/evil.example.com", " /mypage", "/%ZZ", "/%2525252525252Fevil.example.com"];
for (const value of allowed) assert.equal(sanitizeNextPath(value), value);
for (const value of denied) assert.equal(sanitizeNextPath(value), "/mypage", String(value));
assert.equal(sanitizeNextPath("bad", "/admin/products"), "/admin/products");
assert.equal(sanitizeNextPath("bad", "https://evil.example.com"), "/");

const origin = "https://pado-store-phi.vercel.app";
let exchangeCalls = 0;
const shared = {
  "@/lib/auth/next-path": helper,
  "next/server": { NextResponse: { redirect: (url, options) => ({ location: String(url), options }) } },
  "@/lib/security/rate-limit": { enforceRateLimit: async () => ({ ok: true }) }
};
const callback = load("app/auth/callback/route.ts", {
  ...shared,
  "@/lib/supabase/server": { createClient: async () => ({ auth: {
    exchangeCodeForSession: async () => { exchangeCalls++; return { data: { user: null }, error: null }; }
  } }) },
  "@/lib/supabase/admin": { hasSupabaseAdminEnv: () => false,
    createAdminClient: () => { throw new Error("DB access forbidden"); } }
});
for (const code of [false, true]) {
  for (const value of [...allowed, ...denied.filter(v => typeof v === "string")]) {
    const url = new URL("/auth/callback", origin);
    url.searchParams.set("next", value);
    if (code) url.searchParams.set("code", "mock-code");
    const response = await callback.GET({ url: url.href });
    const destination = new URL(response.location);
    assert.equal(destination.origin, origin, `Server origin: ${value}`);
    assert.equal(response.location, new URL(sanitizeNextPath(value), origin).href);
  }
}

const jsx = (type, props) => ({ type, props });
const jsxModules = { "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
  "next/link": { default: "a" }, "@/lib/auth/next-path": helper };
let oauthOptions;
const buttonModule = load("components/auth/KakaoLoginButton.tsx", {
  ...jsxModules,
  react: { useState: (value) => [value, () => {}] },
  "@/lib/supabase/client": { createClient: () => ({ auth: { signInWithOAuth: async (options) => {
    oauthOptions = options; return { error: null };
  } } }) }
});
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
for (const value of [...allowed, ...denied.filter(v => typeof v === "string")]) {
  oauthOptions = undefined;
  const tree = buttonModule.KakaoLoginButton({ nextPath: value });
  await nodes(tree).find(n => n.type === "button").props.onClick();
  assert(oauthOptions, "Client must invoke only the mocked OAuth adapter");
  const target = new URL(oauthOptions.options.redirectTo);
  assert.equal(target.origin, origin);
  assert.equal(target.pathname, "/auth/callback");
  assert.equal(target.searchParams.get("next"), sanitizeNextPath(value));
}
const loginPage = load("app/login/page.tsx", { ...jsxModules,
  "@/components/auth/KakaoLoginButton": { KakaoLoginButton: "login-button" } });
for (const value of [...allowed, ...denied]) {
  const tree = await loginPage.default({ searchParams: Promise.resolve({ next: value }) });
  assert.equal(nodes(tree).find(n => n.type === "login-button").props.nextPath, sanitizeNextPath(value));
}
const dev = load("app/api/dev-admin-login/route.ts", { ...shared,
  "@/lib/auth/dev-admin": { isDevAdminLoginEnabled: () => true, setDevAdminSessionCookie: r => r } });
for (const value of [...allowed, ...denied.filter(v => typeof v === "string")]) {
  const response = await dev.POST({ url: `${origin}/api/dev-admin-login`,
    headers: { get: () => "https://evil.example.com/" },
    formData: async () => new Map([["password", "mock"], ["next", value]]) });
  assert.equal(response.location, new URL(sanitizeNextPath(value, "/admin/products"), origin).href);
}
console.log(JSON.stringify({ ok: true, allowed: allowed.length, denied: denied.length,
  serverCallback: "PASS (code/no-code mocked)", loginPage: "PASS", clientOAuth: "PASS", devAdminExternalReferer: "BLOCKED",
  mockExchanges: exchangeCalls, networkCalls: 0, dbWrites: 0 }));
