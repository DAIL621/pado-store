import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readJsonBody } from "@/lib/api/request";
import { requireAdminApi } from "@/lib/auth/admin-api";
import { normalizeProductDetailInput } from "@/lib/products/detail";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedActions = new Set(["hide", "recover", "end_sale", "soldout"]);
const MAX_BULK_PRODUCTS = 100;

function nextDetail(detail: unknown, action: string, actorId: string) {
  const normalized = normalizeProductDetailInput(detail);
  const state = action === "hide" ? "hidden" : action === "end_sale" ? "ended" : null;
  const currentOperation = (normalized as Record<string, unknown>).operation;
  return {
    ...normalized,
    operationState: state,
    operation: {
      ...(currentOperation && typeof currentOperation === "object" ? currentOperation as Record<string, unknown> : {}),
      state,
      changedAt: new Date().toISOString(),
      changedBy: actorId
    }
  };
}

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;

  const action = String(parsed.body.action ?? "");
  const ids = Array.isArray(parsed.body.ids) ? [...new Set(parsed.body.ids.map(String).filter(Boolean))] : [];
  if (!allowedActions.has(action) || !ids.length || ids.length > MAX_BULK_PRODUCTS) {
    return NextResponse.json({ ok: false, message: "요청한 상품 또는 상태 변경값을 확인해주세요." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: products, error } = await supabase.from("products").select("id, detail_json").in("id", ids);
  if (error) return NextResponse.json({ ok: false, message: "상품 목록을 확인하지 못했습니다." }, { status: 500 });
  const found = new Map((products ?? []).map((product) => [product.id, product]));
  const results: Array<{ id: string; ok: boolean }> = [];

  for (const id of ids) {
    const product = found.get(id);
    if (!product) { results.push({ id, ok: false }); continue; }
    const productUpdate = action === "soldout"
      ? { is_active: true, detail_json: nextDetail(product.detail_json, action, admin.session.user.id) }
      : { is_active: action === "recover", detail_json: nextDetail(product.detail_json, action, admin.session.user.id) };
    const { error: updateError } = await supabase.from("products").update(productUpdate).eq("id", id);
    let optionError = null;
    if (!updateError && action === "soldout") {
      ({ error: optionError } = await supabase.from("product_options").update({ stock: 0 }).eq("product_id", id));
    }
    const ok = !updateError && !optionError;
    results.push({ id, ok });
    if (ok) {
      await supabase.from("operation_logs").insert({
        event_type: `product.bulk_${action}`,
        summary: "관리자 상품 일괄 상태 변경",
        payload: { productId: id, action },
        actor: { id: admin.session.user.id, email: admin.session.user.email ?? null, type: "admin" }
      }).then(() => undefined, () => undefined);
    }
  }

  revalidatePath("/", "layout");
  const succeeded = results.filter((result) => result.ok).length;
  return NextResponse.json({ ok: succeeded === results.length, succeeded, failed: results.length - succeeded, results }, { status: succeeded ? 200 : 500 });
}
