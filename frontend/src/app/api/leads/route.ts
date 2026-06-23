import { NextRequest, NextResponse } from "next/server";
import { leadRequestSchema } from "@/lib/validation";
import { auditClientEvent, readValidatedJson, safeApiError } from "@/lib/security";
import { resolveBackendUrl } from "@/lib/server/backend-proxy";
import { scoreLead } from "@/lib/lead-scoring";
import { storeLocalLead } from "@/lib/server/local-lead-store";

export async function POST(request: NextRequest) {
  try {
    const payload = await readValidatedJson(request, leadRequestSchema);
    const backendUrl = resolveBackendUrl();
    const localFallback = () => {
      const breakdown = scoreLead(payload.profile ?? {}, true);
      const { id } = storeLocalLead(payload, breakdown.score, breakdown.leadCategory);
      auditClientEvent("lead_stored_locally", {
        id,
        lead_category: breakdown.leadCategory,
        selected_project: payload.selected_project ?? payload.profile.selected_project ?? payload.profile.project_name ?? null,
      });
      return NextResponse.json({
        id,
        lead_score: breakdown.score,
        lead_category: breakdown.leadCategory,
        status: "new",
        source: "local-secure-fallback",
      });
    };
    try {
      const response = await fetch(`${backendUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      if (!response.ok) {
        auditClientEvent("lead_proxy_failed", { status: response.status });
        return localFallback();
      }
      return NextResponse.json(await response.json());
    } catch (proxyError) {
      auditClientEvent("lead_proxy_failed", {
        error: proxyError instanceof Error ? proxyError.message : "proxy_error",
      });
      return localFallback();
    }
  } catch (error) {
    auditClientEvent("lead_proxy_error", { message: error instanceof Error ? error.message : "unknown" });
    return safeApiError(error);
  }
}
