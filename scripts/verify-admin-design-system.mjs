import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const ui = read("components/admin/ui/index.tsx");
const css = read("app/admin-design-system.css");
const layout = read("components/admin/AdminLayout.tsx");
const corePages = ["products", "orders", "deliveries", "members", "cs"].map(name => [name, read(`app/admin/${name}/page.tsx`)]);
const requiredComponents = ["AdminButton", "AdminInput", "AdminSelect", "AdminBadge", "AdminStatusBadge", "AdminCard", "AdminStatCard", "AdminTable", "AdminTableContainer", "AdminPagination", "AdminLoading", "AdminEmptyState", "AdminErrorState", "AdminPageHeader", "AdminScreen"];

const checks = [
  ["admin tokens", css.includes("--admin-primary:") && css.includes("--admin-space-4:") && css.includes("--admin-layer-modal:")],
  ["admin scoped css", css.startsWith(".admin-page{") && !/(^|[},])\s*(body|:root)\s*\{/m.test(css)],
  ["required primitives", requiredComponents.every(name => ui.includes(`function ${name}`))],
  ["button variants", ["primary", "secondary", "outline", "ghost", "danger", "success"].every(value => ui.includes(`\"${value}\"`))],
  ["status mapping", ui.includes("const statusTone")],
  ["data states", ["AdminLoading", "AdminEmptyState", "AdminErrorState"].every(name => ui.includes(`function ${name}`))],
  ["accessible feedback", ui.includes('aria-live="polite"') && ui.includes('role="alert"')],
  ["dialog accessibility", ui.includes("useAdminDialog") && ui.includes('event.key === "Escape"') && ui.includes('event.key === "Tab"') && ui.includes('document.body.style.overflow = "hidden"')],
  ["minimum controls", css.includes("min-height:42px") && css.includes("height:60px")],
  ["shared page header", layout.includes("<AdminPageHeader")],
  ["compact admin account", layout.includes("admin-account-compact") && !layout.includes("admin-current-user")],
  ["five core screens", corePages.every(([, source]) => source.includes("<AdminScreen"))],
  ["customer isolation", !read("app/globals.css").includes("admin-design-system.css")],
  ["no browser alert", ![ui, layout, ...corePages.map(([, source]) => source)].some(source => /\balert\s*\(/.test(source))],
];

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, components: requiredComponents.length, corePages: corePages.map(([name]) => name), checks: checks.map(([name]) => name) }, null, 2));
