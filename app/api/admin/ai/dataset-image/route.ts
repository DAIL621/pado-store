import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { datasetImageDir, IMAGE_EXTENSIONS } from "@/lib/admin/ai-real-dataset";
import { requireAdminApi } from "@/lib/auth/admin-api";

export const dynamic = "force-dynamic";

function contentType(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function GET(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "";
  const fileName = url.searchParams.get("file") || "";

  if (!category || !fileName || fileName.includes("..") || path.isAbsolute(fileName)) {
    return NextResponse.json({ ok: false, message: "Invalid dataset image request." }, { status: 400 });
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return NextResponse.json({ ok: false, message: "Unsupported image type." }, { status: 400 });
  }

  const imagePath = path.join(datasetImageDir(category), fileName);
  const resolvedRoot = path.resolve(datasetImageDir(category));
  const resolvedImage = path.resolve(imagePath);
  if (!resolvedImage.startsWith(resolvedRoot) || !fs.existsSync(resolvedImage)) {
    return NextResponse.json({ ok: false, message: "Dataset image not found." }, { status: 404 });
  }

  const body = fs.readFileSync(resolvedImage);
  return new Response(body, {
    headers: {
      "Content-Type": contentType(fileName),
      "Cache-Control": "private, max-age=60"
    }
  });
}
