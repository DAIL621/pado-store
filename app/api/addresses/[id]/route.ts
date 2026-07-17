import { NextResponse } from "next/server";
import { mapAddressInput, mapAddressRow, validateAddressInput } from "@/lib/addresses/mapping";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });

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

  if (input.is_default) {
    const { error } = await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id);
    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("user_addresses")
    .update(input).eq("id", id).eq("user_id", user.id).select("*").single();
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, address: mapAddressRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  const { error } = await supabase.from("user_addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
