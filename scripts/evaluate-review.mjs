import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { __readError: error instanceof Error ? error.message : "unknown" };
  }
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

function normalizeScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const normalized = numeric > 0 && numeric <= 1 ? numeric * 100 : numeric;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function changedText(a, b) {
  return String(a || "").trim() !== String(b || "").trim();
}

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

const category = argValue("category", "abalone");
const images = listImages(category);
const categoryRoot = path.join(root, "datasets", category);
const labelsDir = path.join(categoryRoot, "labels");
const metadataDir = path.join(categoryRoot, "metadata");
const reportDir = path.join(root, "reports", "ai-evaluation");
ensureDir(reportDir);

const rows = images.map((fileName) => {
  const baseName = safeBaseName(fileName);
  const label = readJson(path.join(labelsDir, `${baseName}.json`));
  const metadata = readJson(path.join(metadataDir, `${baseName}.json`));
  const reviewed = Boolean(label?.reviewed || label?.approved);
  const approved = Boolean(label?.approved);
  const held = Boolean(label?.reviewed && !label?.approved);
  const roleMatch = reviewed && metadata ? metadata.suggestedRole === label.expectedRole : false;
  const sectionMatch = reviewed && metadata ? metadata.recommendedSection === label.expectedSection : false;
  return {
    fileName,
    baseName,
    hasLabel: Boolean(label && !label.__readError),
    hasMetadata: Boolean(metadata && !metadata.__readError),
    reviewed,
    approved,
    held,
    aiRole: metadata?.suggestedRole ?? null,
    finalRole: label?.expectedRole ?? null,
    aiSection: metadata?.recommendedSection ?? null,
    finalSection: label?.expectedSection ?? null,
    roleMatch,
    sectionMatch,
    titleChanged: reviewed && changedText(metadata?.title, label?.expectedTitle),
    descriptionChanged: reviewed && changedText(metadata?.description, label?.expectedDescription),
    qualityChanged:
      reviewed &&
      normalizeScore(metadata?.qualityScore) !== null &&
      normalizeScore(label?.expectedQualityScore) !== null &&
      normalizeScore(metadata?.qualityScore) !== normalizeScore(label?.expectedQualityScore)
  };
});

const reviewedRows = rows.filter((row) => row.reviewed);
const approvedRows = rows.filter((row) => row.approved);
const heldRows = rows.filter((row) => row.held);
const pendingRows = rows.filter((row) => !row.reviewed);
const roleMismatchRows = reviewedRows.filter((row) => !row.roleMatch);
const sectionMismatchRows = reviewedRows.filter((row) => !row.sectionMatch);

const report = {
  category,
  generatedAt: new Date().toISOString(),
  totalImages: images.length,
  labelCount: rows.filter((row) => row.hasLabel).length,
  metadataCount: rows.filter((row) => row.hasMetadata).length,
  reviewedCount: reviewedRows.length,
  approvedCount: approvedRows.length,
  pendingCount: pendingRows.length,
  heldCount: heldRows.length,
  roleAccuracy: percent(reviewedRows.length - roleMismatchRows.length, reviewedRows.length),
  sectionAccuracy: percent(reviewedRows.length - sectionMismatchRows.length, reviewedRows.length),
  titleChangedCount: reviewedRows.filter((row) => row.titleChanged).length,
  descriptionChangedCount: reviewedRows.filter((row) => row.descriptionChanged).length,
  qualityChangedCount: reviewedRows.filter((row) => row.qualityChanged).length,
  roleMismatchCount: roleMismatchRows.length,
  sectionMismatchCount: sectionMismatchRows.length,
  reviewedFiles: reviewedRows.map((row) => ({
    fileName: row.fileName,
    aiRole: row.aiRole,
    finalRole: row.finalRole,
    aiSection: row.aiSection,
    finalSection: row.finalSection,
    roleMatch: row.roleMatch,
    sectionMatch: row.sectionMatch
  })),
  missingLabels: rows.filter((row) => !row.hasLabel).map((row) => row.fileName),
  missingMetadata: rows.filter((row) => !row.hasMetadata).map((row) => row.fileName)
};

const reportPath = path.join(reportDir, `${category}-review-latest.json`);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({ ok: true, reportPath, ...report }, null, 2));
