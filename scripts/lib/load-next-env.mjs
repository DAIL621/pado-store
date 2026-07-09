import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return false;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }

  return true;
}

export function loadProjectEnv(projectDir = process.cwd()) {
  try {
    const { loadEnvConfig } = require("@next/env");
    const result = loadEnvConfig(projectDir, true, {
      info: () => {},
      error: () => {}
    });

    return {
      loaded: true,
      loader: "@next/env",
      loadedEnvFiles: result.loadedEnvFiles.map((file) => file.path),
      padoAiImageProvider: process.env.PADO_AI_IMAGE_PROVIDER || "",
      hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
      padoAiImageModel: process.env.PADO_AI_IMAGE_MODEL || ""
    };
  } catch {
    const loadedEnvFiles = [".env.local", ".env"].filter((file) => parseEnvFile(join(projectDir, file)));

    return {
      loaded: loadedEnvFiles.length > 0,
      loader: "manual-env-local",
      loadedEnvFiles,
      padoAiImageProvider: process.env.PADO_AI_IMAGE_PROVIDER || "",
      hasOpenAiApiKey: Boolean(process.env.OPENAI_API_KEY),
      padoAiImageModel: process.env.PADO_AI_IMAGE_MODEL || ""
    };
  }
}
