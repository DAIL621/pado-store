import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

type ProductOptionInput = {
  name: string;
  price_delta: number;
  stock: number;
};

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

  return String(input ?? "")
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

async function requireAdmin() {
  if (!hasSupabaseAdminEnv()) {
    return { ok: false as const, response: NextResponse.json({ ok: false, message: "Supabase 관리자 키가 필요합니다." }, { status: 503 }) };
  }

  const session = await getAdminSession();
  if (!session.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: session.reason === "not-logged-in" ? "로그인이 필요합니다." : "관리자 권한이 필요합니다." },
        { status: session.reason === "not-logged-in" ? 401 : 403 }
      )
    };
  }

  return { ok: true as const };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  if (body.action === "soldout") {
    const { error: productError } = await supabase.from("products").update({ is_active: true }).eq("id", id);
    if (productError) return NextResponse.json({ ok: false, message: productError.message }, { status: 500 });

    const { error: optionError } = await supabase.from("product_options").update({ stock: 0 }).eq("product_id", id);
    if (optionError) return NextResponse.json({ ok: false, message: optionError.message }, { status: 500 });

    return NextResponse.json({ ok: true, mode: "soldout" });
  }

  if (body.action === "recover") {
    const { data: product, error } = await supabase
      .from("products")
      .update({ is_active: true })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, mode: "recover", product });
  }

  const updates: Record<string, unknown> = {};
  if (body.slug !== undefined) updates.slug = String(body.slug).trim();
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.origin !== undefined) updates.origin = String(body.origin).trim();
  if (body.category !== undefined) updates.category = String(body.category).trim();
  if (body.subtitle !== undefined) updates.subtitle = String(body.subtitle).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.basePrice !== undefined) updates.base_price = Number(body.basePrice);
  if (body.imageUrl !== undefined) updates.image_url = String(body.imageUrl).trim();
  if (body.badge !== undefined) updates.badge = String(body.badge).trim() || null;
  if (body.isActive !== undefined) updates.is_active = Boolean(body.isActive);
  if (body.highlights !== undefined) {
    updates.highlights = String(body.highlights)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (updates.base_price !== undefined && (!Number.isFinite(updates.base_price) || Number(updates.base_price) < 0)) {
    return NextResponse.json({ ok: false, message: "기본 가격은 0원 이상의 숫자로 입력해주세요." }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  if (body.options !== undefined) {
    const options = parseOptions(body.options);
    if (!options.length || options.some((option) => !option.name || !Number.isFinite(option.price_delta) || !Number.isFinite(option.stock) || option.stock < 0)) {
      return NextResponse.json({ ok: false, message: "옵션 형식을 확인해주세요. 예: 1kg|0|30" }, { status: 400 });
    }

    const { data: existingOptions, error: existingOptionsError } = await supabase
      .from("product_options")
      .select("id")
      .eq("product_id", id)
      .order("created_at", { ascending: true });

    if (existingOptionsError) {
      return NextResponse.json({ ok: false, message: existingOptionsError.message }, { status: 500 });
    }

    for (const [index, option] of options.entries()) {
      const existingOptionId = existingOptions?.[index]?.id;
      if (existingOptionId) {
        const { error: updateOptionError } = await supabase
          .from("product_options")
          .update(option)
          .eq("id", existingOptionId);

        if (updateOptionError) return NextResponse.json({ ok: false, message: updateOptionError.message }, { status: 500 });
      } else {
        const { error: insertOptionError } = await supabase
          .from("product_options")
          .insert({ ...option, product_id: id });

        if (insertOptionError) return NextResponse.json({ ok: false, message: insertOptionError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mode: "soft-delete" });
}
