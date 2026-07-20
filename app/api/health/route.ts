import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "pado-story-store",
    status: "ok",
    readiness: "available"
  });
}
