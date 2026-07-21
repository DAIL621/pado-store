import fs from "node:fs";

const css = fs.readFileSync("app/admin-common-ux.css", "utf8");
const layout = fs.readFileSync("components/admin/AdminLayout.tsx", "utf8");

const checks = [
  ["admin scope", css.includes(".admin-page{")],
  ["storefront isolation", !css.includes("body{") && !css.includes(":root{")],
  ["minimum text token", css.includes("--admin-text-xs:13px")],
  ["table head token", css.includes("--admin-table-head:14px")],
  ["body text token", css.includes("--admin-table-body:14px")],
  ["control height token", css.includes("--admin-control-height:42px")],
  ["row height token", css.includes("--admin-row-height:60px")],
  ["sidebar text", css.includes("font-size:14px;font-weight:600")],
  ["focus visibility", css.includes(":focus-visible")],
  ["horizontal table fallback", css.includes("overflow-x:auto")],
  ["admin layout scope", layout.includes('className="admin-page"')],
];

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checks: checks.map(([name]) => name) }, null, 2));
