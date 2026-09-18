import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization");
  if (!expected || !supplied?.startsWith("Bearer ")) return false;
  const actual = supplied.slice(7);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length
    && timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (!hasSupabaseAdminEnv()) {
    return NextResponse.json({ ok: false, message: "Database configuration is unavailable." }, { status: 503 });
  }
  const executedAt = new Date().toISOString();
  const { data, error } = await createAdminClient().rpc("pado_expire_pending_orders_v2", {
    p_limit: 500
  });
  if (error) {
    return NextResponse.json({ ok: false, processed: 0, executedAt }, { status: 500 });
  }
  return NextResponse.json({ ok: true, processed: Number(data ?? 0), executedAt });
}
