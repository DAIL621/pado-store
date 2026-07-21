import { NextResponse } from "next/server";
import { mapAddressInput, mapAddressRow, validateAddressInput } from "@/lib/addresses/mapping";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });

  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, addresses: (data ?? []).map(mapAddressRow) });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = mapAddressInput(body);
  const validationMessage = validateAddressInput(input);
  if (validationMessage) return NextResponse.json({ ok: false, message: validationMessage }, { status: 400 });

  const { data, error } = await supabase
    .from("user_addresses")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, address: mapAddressRow(data) }, { status: 201 });
}
