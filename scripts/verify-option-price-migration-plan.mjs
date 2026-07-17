import fs from "node:fs";
import assert from "node:assert/strict";

const forward = fs.readFileSync("docs/sql/option-price-column-forward.sql", "utf8");
const cleanup = fs.readFileSync("docs/sql/option-price-column-cleanup.sql", "utf8");
const rollback = fs.readFileSync("docs/sql/option-price-column-rollback.sql", "utf8");
const design = fs.readFileSync("docs/option-price-column-migration.md", "utf8");

for (const column of ["price", "regular_price", "coupang_price"]) {
  assert(forward.includes(`add column if not exists ${column}`), `forward migration is missing ${column}`);
}
assert(forward.includes("option_price_migration_backup_20260717"), "forward migration must create a rollback backup");
assert(forward.includes("detail_json -> 'optionPricing'"), "forward migration must read temporary JSON prices");
assert(forward.includes("base_price + po.price_delta"), "legacy sale prices must be backfilled safely");
assert(forward.includes("alter column price set not null"), "final sale price must be required");
assert(forward.includes("validate constraint"), "price constraints must be validated");
assert(cleanup.includes("- 'optionPricing'"), "cleanup must remove only temporary option pricing JSON");
assert(rollback.includes("jsonb_set") && rollback.includes("option_pricing_json"), "rollback must restore JSON pricing");
assert(rollback.includes("Safest default: retain price columns"), "rollback must avoid destructive column drops by default");
for (const phase of ["Forward SQL", "컬럼 우선 읽기/쓰기", "Rollback"]) assert(design.includes(phase), `design is missing ${phase}`);

console.log(JSON.stringify({ ok: true, checks: ["backup", "price-columns", "json-backfill", "legacy-price-backfill", "constraints", "column-first-rollout", "json-cleanup", "non-destructive-rollback"] }, null, 2));
