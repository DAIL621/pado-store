import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ service: "pado-story-store", status: "ok", supabaseReady: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) });
}
