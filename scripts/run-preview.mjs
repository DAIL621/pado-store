import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { preparePreviewEnv } from "./lib/preview-env.mjs";

const command = process.argv[2];
const nextCommands = new Set(["dev", "build", "start"]);

if (command !== "check" && !nextCommands.has(command)) {
  console.error("사용법: node scripts/run-preview.mjs <dev|build|start|check>");
  process.exit(1);
}

try {
  const { childEnv, previewKeys, maskedKeys } = preparePreviewEnv();

  console.log(
    `[preview-env] 격리 확인 완료: preview ${previewKeys.length}개 로드, fallback ${maskedKeys.length}개 차단`
  );

  if (command === "check") {
    process.exit(0);
  }

  const nextCli = resolve("node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, command], {
    cwd: process.cwd(),
    env: childEnv,
    stdio: "inherit",
    shell: false
  });

  child.on("error", (error) => {
    console.error(`[preview-env] Next.js 실행 실패: ${error.message}`);
    process.exit(1);
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`[preview-env] Next.js가 ${signal} 신호로 종료되었습니다.`);
      process.exit(1);
    }
    process.exit(code ?? 1);
  });
} catch (error) {
  console.error(`[preview-env] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
