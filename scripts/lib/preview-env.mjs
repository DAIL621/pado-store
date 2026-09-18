import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FALLBACK_ENV_FILES = [
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".env.test.local",
  ".env",
  ".env.development",
  ".env.production",
  ".env.test",
  ".env.example"
];

const SAFE_PARENT_KEYS = [
  "PATH",
  "PATHEXT",
  "SystemRoot",
  "SYSTEMROOT",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "HOMEDRIVE",
  "HOMEPATH",
  "HOME",
  "NUMBER_OF_PROCESSORS",
  "PROCESSOR_ARCHITECTURE",
  "TERM",
  "CI",
  "PORT",
  "NO_COLOR",
  "FORCE_COLOR"
];

export const REQUIRED_PREVIEW_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL"
];

export function parseEnv(source) {
  const values = new Map();

  for (const rawLine of source.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const separator = normalized.indexOf("=");
    if (separator < 1) continue;

    const key = normalized.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = normalized.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values.set(key, value);
  }

  return values;
}

function readEnvFile(filePath) {
  if (!existsSync(filePath)) return new Map();
  return parseEnv(readFileSync(filePath, "utf8"));
}

export function preparePreviewEnv(projectDir = process.cwd(), baseEnv = process.env) {
  const previewPath = resolve(projectDir, ".env.preview.local");
  if (!existsSync(previewPath)) {
    throw new Error(".env.preview.local 파일이 없습니다.");
  }

  const previewValues = readEnvFile(previewPath);
  const maskedKeys = new Set();

  for (const filename of FALLBACK_ENV_FILES) {
    if (filename === ".env.preview.local") continue;
    for (const key of readEnvFile(resolve(projectDir, filename)).keys()) {
      maskedKeys.add(key);
    }
  }

  // Next.js가 뒤이어 .env.local 등을 읽더라도 운영 값이 들어오지 않도록
  // 알려진 앱 환경변수를 빈 값으로 먼저 정의한다.
  const childEnv = {};
  for (const key of SAFE_PARENT_KEYS) {
    if (baseEnv[key] !== undefined) childEnv[key] = baseEnv[key];
  }
  for (const key of maskedKeys) childEnv[key] = "";
  for (const [key, value] of previewValues) childEnv[key] = value;

  const missing = REQUIRED_PREVIEW_KEYS.filter((key) => !previewValues.get(key)?.trim());
  if (missing.length > 0) {
    throw new Error(`필수 Preview 환경변수가 비어 있습니다: ${missing.join(", ")}`);
  }

  const productionValues = readEnvFile(resolve(projectDir, ".env.local"));
  const overlaps = REQUIRED_PREVIEW_KEYS.filter((key) => {
    const previewValue = previewValues.get(key)?.trim();
    const productionValue = productionValues.get(key)?.trim();
    return Boolean(previewValue && productionValue && previewValue === productionValue);
  });
  if (overlaps.length > 0) {
    throw new Error(
      `Preview 값이 운영 .env.local과 같습니다. 실행을 중단합니다: ${overlaps.join(", ")}`
    );
  }

  let supabaseUrl;
  try {
    supabaseUrl = new URL(previewValues.get("NEXT_PUBLIC_SUPABASE_URL"));
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL이 올바른 URL이 아닙니다.");
  }
  if (supabaseUrl.protocol !== "https:" || !supabaseUrl.hostname.endsWith(".supabase.co")) {
    throw new Error("Preview Supabase URL은 https://*.supabase.co 형식이어야 합니다.");
  }

  return {
    childEnv,
    previewKeys: [...previewValues.keys()],
    maskedKeys: [...maskedKeys]
  };
}
