import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/admin";

type ProductOptionInput = {
  name: string;
  price_delta: number;
  stock: number;
};

function missingSupabaseResponse() {
  return NextResponse.json(
    {
      ok: false,
      message: "Supabase 환경변수가 아직 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 입력해주세요."
    },
    { status: 503 }
  );
}

function parseOptions(input: unknown): ProductOptionInput[] {
  if (Array.isArray(input)) {
    return input
      .map((option) => ({
        name: String(option.name ?? "").trim(),
        price_delta: Number(option.priceDelta ?? option.price_delta ?? 0),
        stock: Number(option.stock ?? 0)
      }))
      .filter((option) => option.name);
  }

  return String(input ?? "기본 옵션")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, priceDelta = "0", stock = "0"] = line.split("|").map((part) => part.trim());
      return {
        name,
        price_delta: Number(priceDelta),
        stock: Number(stock)
      };
    });
}

export async function GET() {
  if (!hasSupabaseAdminEnv()) return missingSupabaseResponse();

  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    return NextResponse.json(
      { ok: false, message: adminSession.reason === "not-logged-in" ? "로그인이 필요합니다." : "관리자 권한이 필요합니다." },
      { status: adminSession.reason === "not-logged-in" ? 401 : 403 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_options(id, name, price_delta, stock)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, products: data });
}

export async function POST(request: Request) {
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json(
      {
        ok: false,
        message: "상품 등록에는 Supabase 관리자 키가 필요합니다. .env.local에 SUPABASE_SERVICE_ROLE_KEY를 입력해주세요."
      },
      { status: 503 }
    );
  }

  const adminSession = await getAdminSession();
  if (!adminSession.ok) {
    return NextResponse.json(
      { ok: false, message: adminSession.reason === "not-logged-in" ? "로그인이 필요합니다." : "관리자 권한이 필요합니다." },
      { status: adminSession.reason === "not-logged-in" ? 401 : 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const supabase = createAdminClient();

  const requiredFields = ["name", "origin", "category", "subtitle", "description", "basePrice"] as const;
  const missingField = requiredFields.find((field) => !String(body[field] ?? "").trim());
  if (missingField) {
    return NextResponse.json({ ok: false, message: "필수 상품 정보를 모두 입력해주세요." }, { status: 400 });
  }

  const basePrice = Number(body.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    return NextResponse.json({ ok: false, message: "기본 가격은 0원 이상의 숫자로 입력해주세요." }, { status: 400 });
  }

  const slug =
    body.slug ||
    String(body.name ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "");

  if (!slug) {
    return NextResponse.json({ ok: false, message: "상품 URL 이름을 만들 수 없습니다. slug를 직접 입력해주세요." }, { status: 400 });
  }

  const optionInputs = parseOptions(body.options);

  if (!optionInputs.length || optionInputs.some((option) => !option.name || !Number.isFinite(option.price_delta) || !Number.isFinite(option.stock) || option.stock < 0)) {
    return NextResponse.json(
      { ok: false, message: "옵션 형식을 확인해주세요. 예: 1kg|0|30" },
      { status: 400 }
    );
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      name: body.name,
      origin: body.origin,
      category: body.category,
      subtitle: body.subtitle,
      description: body.description,
      base_price: basePrice,
      image_url: body.imageUrl || "/images/products/wando-abalone.webp",
      badge: body.badge || null,
      highlights: String(body.highlights ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      is_active: true
    })
    .select()
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { ok: false, message: isDuplicate ? "이미 같은 URL 이름(slug)의 상품이 있습니다." : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const options = optionInputs.map((option) => ({ ...option, product_id: product.id }));

  const { error: optionError } = await supabase.from("product_options").insert(options);
  if (optionError) return NextResponse.json({ ok: false, message: optionError.message }, { status: 500 });

  return NextResponse.json({ ok: true, product, productUrl: `/products/${product.slug}` });
}
