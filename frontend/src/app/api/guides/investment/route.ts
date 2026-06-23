import { NextResponse } from "next/server";
import { buildGuidePdf } from "@/lib/server/pdf-generator";
import { trackAnalyticsEvent } from "@/lib/server/analytics-store";

export const runtime = "nodejs";

export async function GET() {
  trackAnalyticsEvent("guide_downloaded", { kind: "investment", filename: "Ajman Investment Guide.pdf" });
  return new NextResponse(buildGuidePdf("investment"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Ajman Investment Guide.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
