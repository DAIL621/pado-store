import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const requiredFiles = [
  "components/products/ProductDetailTemplate.tsx",
  "lib/products/detail-auto-engine.ts",
  "lib/products/detail-template-engine.ts",
  "scripts/capture-detail.mjs",
  "scripts/score-detail-quality.mjs"
];
const applicationFiles = requiredFiles.filter((file) => !file.startsWith("scripts/"));

const forbiddenPatterns = [
  { pattern: /\bdebugger\b/, label: "debugger statement" },
  { pattern: /console\.log\(/, label: "console.log" }
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    failures.push(`Missing required file: ${file}`);
  }
}

for (const file of applicationFiles) {
  if (!existsSync(file)) {
    continue;
  }

  const source = readFileSync(file, "utf8");
  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(source)) failures.push(`${file}: contains ${label}`);
  }
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
for (const scriptName of ["build", "verify:admin", "verify:detail-json", "verify:detail-template", "capture:detail", "score:detail", "dev:ensure"]) {
  if (!packageJson.scripts?.[scriptName]) failures.push(`package.json missing script: ${scriptName}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("basic lint passed");
