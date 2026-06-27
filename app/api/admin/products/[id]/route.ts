import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { readJsonBody } from "@/lib/api/request";
import { hasInvalidProductOption, parseProductOptions } from "@/lib/admin/product-options";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

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
  const parsedBody = await readJsonBody(request);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.body;
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

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { ok: false, message: isDuplicate ? "이미 같은 URL 이름(slug)의 상품이 있습니다." : error.message },
      { status: isDuplicate ? 409 : 500 }
    );
  }

  if (body.options !== undefined) {
    const options = parseProductOptions(body.options);
    if (!options.length || hasInvalidProductOption(options)) {
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
