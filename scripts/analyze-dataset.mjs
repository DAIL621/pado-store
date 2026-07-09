import fs from "node:fs";
import path from "node:path";
import { loadProjectEnv } from "./lib/load-next-env.mjs";

const root = process.cwd();
const envStatus = loadProjectEnv(root);
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_OPENAI_DATA_URL_LENGTH = 8 * 1024 * 1024;

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeBaseName(fileName) {
  const parsed = path.parse(fileName);
  const ascii = parsed.name
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return ascii || Buffer.from(parsed.name).toString("hex").slice(0, 32);
}

function imageIdFor(category, fileName) {
  return `${category}-${safeBaseName(fileName)}`;
}

function listImages(category) {
  const imagesDir = path.join(root, "datasets", category, "images");
  if (!fs.existsSync(imagesDir)) return [];
  return fs
    .readdirSync(imagesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== ".gitkeep" && IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "ko"));
}

function mimeFor(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function toDataUrl(filePath, fileName) {
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeFor(fileName)};base64,${base64}`;
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[_-]+/g, " ");
}

function roleCopy(role) {
  const copy = {
    hero: ["대표 상품 사진", "상품이 가장 크게 보이는 대표 후보 사진입니다.", "첫 화면 대표 이미지 후보입니다.", "heroImages"],
    origin: ["산지/현장 사진", "산지 또는 생산 현장 분위기를 보여주는 사진입니다.", "상품이 준비되는 환경을 보여줍니다.", "journey"],
    process: ["선별 작업 사진", "선별, 손질, 작업 과정을 보여주는 사진입니다.", "상품 준비 과정을 확인할 수 있습니다.", "process"],
    freshness: ["신선도 확인 사진", "질감과 상태를 가까이에서 확인할 수 있는 사진입니다.", "전복의 상태와 질감을 보여줍니다.", "gallery"],
    sizeComparison: ["크기 비교 사진", "손이나 도구와 함께 실제 크기감을 보여주는 사진입니다.", "실제 크기감을 이해하기 좋습니다.", "gallery"],
    package: ["포장 상태 사진", "실제 포장이나 구성 상태를 보여주는 사진입니다.", "포장 상태를 확인할 수 있습니다.", "packaging"],
    shipping: ["배송 준비 사진", "아이스팩, 박스 등 신선 배송 요소를 보여주는 사진입니다.", "배송 준비 상태를 확인할 수 있습니다.", "packaging"],
    components: ["구성품 사진", "고객이 받는 구성품을 보여주는 사진입니다.", "구성품을 확인할 수 있습니다.", "components"],
    cooking: ["조리 예시 사진", "먹는 방법이나 완성 요리를 보여주는 사진입니다.", "어떻게 먹으면 좋은지 보여줍니다.", "recipes"],
    detail: ["상세 질감 사진", "상품의 표면, 질감, 세부 상태를 보여주는 사진입니다.", "상세 상태를 가까이에서 확인할 수 있습니다.", "gallery"],
    unknown: ["확인 필요 사진", "사진 역할이 명확하지 않아 운영자 검수가 필요합니다.", "운영자 확인이 필요한 사진입니다.", "extraSections"]
  };
  return copy[role] || copy.unknown;
}

function mockAnalyze({ fileName, index, category }) {
  const name = normalize(fileName);
  let role = "detail";
  let confidence = 76;
  let qualityScore = 78;

  if (/(blur|dark|흐림|어두)/.test(name)) {
    role = "detail";
    confidence = 58;
    qualityScore = 48;
  } else if (/(ice|icepack|cold|delivery|box|shipping|아이스|배송|냉장)/.test(name)) {
    role = "shipping";
    confidence = 88;
    qualityScore = 82;
  } else if (/(pack|package|pouch|bag|포장|박스)/.test(name)) {
    role = "package";
    confidence = 86;
    qualityScore = 82;
  } else if (/(cook|recipe|porridge|grill|soup|dish|죽|구이|요리|조리)/.test(name)) {
    role = "cooking";
    confidence = 87;
    qualityScore = 84;
  } else if (/(hand|size|compare|ruler|손|크기|비교)/.test(name)) {
    role = "sizeComparison";
    confidence = 84;
    qualityScore = 80;
  } else if (/(선별|작업|process|sorting|clean|trim)/.test(name)) {
    role = "process";
    confidence = 83;
    qualityScore = 80;
  } else if (/(main|hero|대표|전복|abalone|wando)/.test(name) || index === 0) {
    role = "hero";
    confidence = 86;
    qualityScore = 86;
  } else if (category === "abalone") {
    role = index < 6 ? "freshness" : "detail";
    confidence = index < 6 ? 82 : 76;
    qualityScore = index < 6 ? 82 : 76;
  }

  const [title, description, caption, recommendedSection] = roleCopy(role);
  return {
    suggestedRole: role,
    recommendedSection,
    confidence,
    qualityScore,
    heroRank: undefined,
    title,
    description,
    caption,
    warningMessage: qualityScore < 60 ? "사진 품질 또는 역할 확인이 필요합니다." : "",
    reasoningSummary: "파일명, 업로드 순서, 상품 카테고리 기반 fallback 분석 결과입니다."
  };
}

async function openAiAnalyze({ dataUrl, fileName, category }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const provider = String(process.env.PADO_AI_IMAGE_PROVIDER || "mock").toLowerCase();
  if (!apiKey || provider !== "openai") {
    throw new Error(
      `OpenAI Provider 설정이 필요합니다. provider=${provider || "(empty)"}, hasOpenAiApiKey=${Boolean(apiKey)}`
    );
  }
  if (dataUrl.length > MAX_OPENAI_DATA_URL_LENGTH) throw new Error("이미지가 안전한 OpenAI data URL 분석 기준보다 큽니다.");

  const prompt = [
    "파도스토리 수산물 상품 사진을 분석하세요.",
    "응답의 title, description, caption, warningMessage, reasoningSummary는 반드시 자연스러운 한국어로 작성하세요.",
    "엄격한 JSON만 반환하세요. 키: suggestedRole, recommendedSection, confidence, qualityScore, title, description, caption, warningMessage, reasoningSummary.",
    "역할: hero, origin, process, freshness, sizeComparison, package, shipping, components, cooking, detail, review, unknown.",
    "섹션: heroImages, journey, gallery, packaging, recipes, components, process, extraSections.",
    "사진에 보이지 않는 원산지, 조업일, 국내산 여부, 당일출고 여부는 단정하지 마세요.",
    "제목과 설명은 운영자가 바로 상세페이지 초안에 쓸 수 있을 정도로 짧고 신뢰감 있게 작성하세요.",
    `상품군: ${category}. 파일명: ${fileName}.`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.PADO_AI_IMAGE_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ]
    })
  });

  if (!response.ok) throw new Error(`OpenAI 요청 실패: ${response.status}`);
  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI 응답이 비어 있습니다.");
  return JSON.parse(content);
}

function normalizeAnalysis(raw, fallback) {
  const roleValues = new Set(["hero", "origin", "process", "freshness", "sizeComparison", "package", "shipping", "components", "cooking", "detail", "review", "unknown"]);
  const sectionValues = new Set(["heroImages", "journey", "gallery", "packaging", "recipes", "components", "process", "extraSections"]);
  const role = roleValues.has(raw.suggestedRole) ? raw.suggestedRole : fallback.suggestedRole;
  const section = sectionValues.has(raw.recommendedSection) ? raw.recommendedSection : fallback.recommendedSection;
  return {
    suggestedRole: role,
    recommendedSection: section,
    confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence ?? fallback.confidence)))),
    qualityScore: Math.max(0, Math.min(100, Math.round(Number(raw.qualityScore ?? fallback.qualityScore)))),
    title: String(raw.title || fallback.title),
    description: String(raw.description || fallback.description),
    caption: String(raw.caption || fallback.caption || ""),
    warningMessage: String(raw.warningMessage || fallback.warningMessage || ""),
    reasoningSummary: String(raw.reasoningSummary || fallback.reasoningSummary || "")
  };
}

function assignHeroRanks(results) {
  const candidates = results
    .map((item, index) => ({
      index,
      score: item.qualityScore + (item.suggestedRole === "hero" ? 24 : 0) + (item.suggestedRole === "freshness" ? 8 : 0) + (index === 0 ? 6 : 0)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const rank = new Map(candidates.map((item, index) => [item.index, index + 1]));
  return results.map((item, index) => ({ ...item, heroRank: rank.get(index) }));
}

function metadataFrom({ category, fileName, result, provider, fallbackUsed }) {
  return {
    imageId: imageIdFor(category, fileName),
    fileName,
    filePath: path.join("datasets", category, "images", fileName).replace(/\\/g, "/"),
    category,
    provider,
    fallbackUsed,
    suggestedRole: result.suggestedRole,
    recommendedSection: result.recommendedSection,
    confidence: result.confidence,
    qualityScore: result.qualityScore,
    heroRank: result.heroRank,
    title: result.title,
    description: result.description,
    caption: result.caption,
    warningMessage: result.warningMessage,
    reasoningSummary: result.reasoningSummary,
    analyzedAt: new Date().toISOString()
  };
}

function labelFrom(metadata) {
  return {
    imageId: metadata.imageId,
    fileName: metadata.fileName,
    productCategory: metadata.category,
    expectedRole: metadata.suggestedRole,
    expectedSection: metadata.recommendedSection,
    expectedHeroRank: metadata.heroRank ?? null,
    expectedQualityScore: metadata.qualityScore,
    expectedWarnings: metadata.warningMessage ? [metadata.warningMessage] : [],
    expectedCaption: metadata.caption || "",
    expectedTitle: metadata.title,
    expectedDescription: metadata.description,
    reviewed: false,
    approved: false,
    reviewerNotes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function roleCounts(results) {
  return results.reduce((acc, item) => {
    acc[item.suggestedRole] = (acc[item.suggestedRole] || 0) + 1;
    return acc;
  }, {});
}

const category = argValue("category", "abalone");
const images = listImages(category);
const categoryRoot = path.join(root, "datasets", category);
const metadataDir = path.join(categoryRoot, "metadata");
const labelsDir = path.join(categoryRoot, "labels");
const reportsDir = path.join(root, "reports", "ai-analysis");

ensureDir(metadataDir);
ensureDir(labelsDir);
ensureDir(reportsDir);

if (!images.length) {
  console.error(`No images found in datasets/${category}/images`);
  process.exit(1);
}

const rawResults = [];
let fallbackCount = 0;

for (let index = 0; index < images.length; index += 1) {
  const fileName = images[index];
  const filePath = path.join(categoryRoot, "images", fileName);
  const fallback = mockAnalyze({ fileName, index, category });
  let provider = "mock";
  let fallbackUsed = true;
  let fallbackReason = "";
  let analysis = fallback;

  try {
    const dataUrl = toDataUrl(filePath, fileName);
    const raw = await openAiAnalyze({ dataUrl, fileName, category });
    analysis = normalizeAnalysis(raw, fallback);
    provider = "openai";
    fallbackUsed = false;
  } catch (error) {
    fallbackReason = error instanceof Error ? error.message : "unknown";
    analysis = {
      ...fallback,
      reasoningSummary: `${fallback.reasoningSummary} 대체 분석 사유: ${fallbackReason}`
    };
  }

  if (fallbackUsed) fallbackCount += 1;
  rawResults.push({ fileName, provider, fallbackUsed, fallbackReason, analysis });
}

const ranked = assignHeroRanks(rawResults.map((item) => item.analysis));
const metadataResults = rawResults.map((item, index) => {
  const metadata = metadataFrom({
    category,
    fileName: item.fileName,
    result: ranked[index],
    provider: item.provider,
    fallbackUsed: item.fallbackUsed
  });
  const label = labelFrom(metadata);
  fs.writeFileSync(path.join(metadataDir, `${safeBaseName(item.fileName)}.json`), `${JSON.stringify(metadata, null, 2)}\n`);
  fs.writeFileSync(path.join(labelsDir, `${safeBaseName(item.fileName)}.json`), `${JSON.stringify(label, null, 2)}\n`);
  return metadata;
});

const report = {
  category,
  analyzedAt: new Date().toISOString(),
  totalImages: images.length,
  successCount: metadataResults.length,
  fallbackCount,
  envStatus,
  providerIntent: process.env.PADO_AI_IMAGE_PROVIDER || "mock",
  fallbackReasons: rawResults
    .filter((item) => item.fallbackUsed)
    .slice(0, 10)
    .map((item) => ({ fileName: item.fileName, reason: item.fallbackReason })),
  roleCounts: roleCounts(metadataResults),
  averageConfidence: Math.round(metadataResults.reduce((sum, item) => sum + item.confidence, 0) / metadataResults.length),
  averageQualityScore: Math.round(metadataResults.reduce((sum, item) => sum + item.qualityScore, 0) / metadataResults.length),
  heroTop5: metadataResults
    .filter((item) => item.heroRank)
    .sort((a, b) => (a.heroRank || 99) - (b.heroRank || 99))
    .slice(0, 5)
    .map((item) => ({ fileName: item.fileName, heroRank: item.heroRank, confidence: item.confidence, qualityScore: item.qualityScore })),
  needsReview: metadataResults
    .filter((item) => item.confidence < 70 || item.qualityScore < 70 || item.warningMessage)
    .map((item) => ({ fileName: item.fileName, confidence: item.confidence, qualityScore: item.qualityScore, warningMessage: item.warningMessage })),
  warnings: metadataResults.filter((item) => item.warningMessage).map((item) => ({ fileName: item.fileName, warningMessage: item.warningMessage }))
};

fs.writeFileSync(path.join(reportsDir, `${category}-latest.json`), `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({ ok: true, ...report }, null, 2));
