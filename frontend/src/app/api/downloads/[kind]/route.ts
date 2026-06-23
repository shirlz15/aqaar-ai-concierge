import { NextRequest, NextResponse } from "next/server";
import { buildGuidePdf, getDownloadFilename } from "@/lib/server/pdf-generator";
import { trackAnalyticsEvent } from "@/lib/server/analytics-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  const projectName = request.nextUrl.searchParams.get("project") || undefined;
  const pdf = buildGuidePdf(kind, projectName);
  const filename = getDownloadFilename(kind, projectName);
  trackAnalyticsEvent("guide_downloaded", { kind, project_name: projectName || null, filename });
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
