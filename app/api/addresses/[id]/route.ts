import { NextResponse } from "next/server";
import { mapAddressInput, mapAddressRow, validateAddressInput } from "@/lib/addresses/mapping";
import { requireTrustedOrigin } from "@/lib/security/origin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(request: Request, context: RouteContext) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });

  const limited = await enforceRateLimit(request, "addressWrite", { userId: user.id, resourceId: id });
  if (!limited.ok) return limited.response;
  const body = await request.json().catch(() => ({}));
  if (body.markUsed === true) {
    const { data, error } = await supabase
      .from("user_addresses")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", user.id).select("*").single();
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, address: mapAddressRow(data) });
  }

  const input = mapAddressInput(body);
  const validationMessage = validateAddressInput(input);
  if (validationMessage) return NextResponse.json({ ok: false, message: validationMessage }, { status: 400 });

  const { data, error } = await supabase
    .from("user_addresses")
    .update(input).eq("id", id).eq("user_id", user.id).select("*").single();
  if (error?.code === "PGRST116") return NextResponse.json({ ok: false, message: "배송지를 찾을 수 없습니다." }, { status: 404 });
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, address: mapAddressRow(data) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const origin = requireTrustedOrigin(request);
  if (!origin.ok) return origin.response;
  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  const limited = await enforceRateLimit(request, "addressWrite", { userId: user.id, resourceId: id });
  if (!limited.ok) return limited.response;
  const { data, error } = await supabase.from("user_addresses").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, message: "배송지를 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
