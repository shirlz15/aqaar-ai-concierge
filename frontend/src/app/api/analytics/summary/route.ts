import { NextResponse } from "next/server";
import { summarizeAnalytics } from "@/lib/server/analytics-store";

export async function GET() {
  return NextResponse.json(summarizeAnalytics(), {
    headers: { "Cache-Control": "no-store" },
  });
}
