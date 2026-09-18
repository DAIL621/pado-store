import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { preparePreviewEnv } from "./lib/preview-env.mjs";

const testDir = mkdtempSync(join(tmpdir(), "pado-preview-env-"));

try {
  writeFileSync(
    join(testDir, ".env.local"),
    [
      "NEXT_PUBLIC_SUPABASE_URL=https://production.supabase.co",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon",
      "SUPABASE_SERVICE_ROLE_KEY=production-service",
      "PRODUCTION_ONLY_SECRET=must-not-leak"
    ].join("\n")
  );
  writeFileSync(
    join(testDir, ".env.preview.local"),
    [
      "NEXT_PUBLIC_SUPABASE_URL=https://preview.supabase.co",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=preview-anon",
      "SUPABASE_SERVICE_ROLE_KEY=preview-service"
    ].join("\n")
  );

  const result = preparePreviewEnv(testDir, {
    PATH: process.env.PATH,
    PRODUCTION_ONLY_SECRET: "inherited-production-value",
    UNLISTED_PARENT_SECRET: "must-not-be-inherited"
  });

  assert.equal(
    result.childEnv.NEXT_PUBLIC_SUPABASE_URL,
    "https://preview.supabase.co",
    "Preview Supabase URL이 우선되어야 합니다."
  );
  assert.equal(
    result.childEnv.PRODUCTION_ONLY_SECRET,
    "",
    ".env.local 전용 값은 빈 값으로 차단되어야 합니다."
  );
  assert.ok(result.maskedKeys.includes("PRODUCTION_ONLY_SECRET"));
  assert.equal(
    result.childEnv.UNLISTED_PARENT_SECRET,
    undefined,
    "Preview 파일에 없는 부모 프로세스 비밀값은 상속하지 않아야 합니다."
  );

  writeFileSync(
    join(testDir, ".env.preview.local"),
    [
      "NEXT_PUBLIC_SUPABASE_URL=https://production.supabase.co",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=production-anon",
      "SUPABASE_SERVICE_ROLE_KEY=production-service"
    ].join("\n")
  );
  assert.throws(
    () => preparePreviewEnv(testDir),
    /운영 \.env\.local과 같습니다/,
    "운영과 동일한 Supabase 자격정보는 거부되어야 합니다."
  );

  console.log("PASS: Preview 환경 로더가 운영 fallback을 차단합니다.");
} finally {
  rmSync(testDir, { recursive: true, force: true });
}
