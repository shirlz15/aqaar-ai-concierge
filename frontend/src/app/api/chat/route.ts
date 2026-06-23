import { NextRequest, NextResponse } from "next/server";
import { chatRequestSchema } from "@/lib/validation";
import { auditClientEvent, readValidatedJson, safeApiError } from "@/lib/security";
import { extractIntent } from "@/lib/server/intent-engine";
import { getKnowledgeBase } from "@/lib/server/knowledge-base";
import { leadSummary, nextConciergeReply, recommendProperties } from "@/lib/server/recommendation-engine";
import { buildProxyHeaders, resolveBackendUrl } from "@/lib/server/backend-proxy";
import { trackAnalyticsEvent } from "@/lib/server/analytics-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = await readValidatedJson(request, chatRequestSchema);
    const knowledge = getKnowledgeBase();
    const profile = extractIntent(payload.message, payload.profile ?? {}, knowledge);
    const recommendations = recommendProperties(profile, knowledge);
    const summary = leadSummary(profile);
    const journeyEvent =
      profile.intent === "buy"
        ? "buy_journey_started"
        : profile.intent === "rent"
          ? "rent_journey_started"
          : profile.intent === "invest"
            ? "invest_journey_started"
            : "chat_started";
    trackAnalyticsEvent(journeyEvent, { session_id: payload.session_id, message: payload.message.slice(0, 120) });
    const backendUrl = resolveBackendUrl();
    if (!backendUrl) {
      return NextResponse.json({
        reply: nextConciergeReply(profile, recommendations, knowledge),
        profile,
        lead_score: summary.lead_score,
        lead_category: summary.lead_category,
        recommendations,
      });
    }
    const response = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: buildProxyHeaders(request),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) {
      auditClientEvent("chat_proxy_failed", { status: response.status });
      return NextResponse.json({
        reply: nextConciergeReply(profile, recommendations, knowledge),
        profile,
        lead_score: summary.lead_score,
        lead_category: summary.lead_category,
        recommendations,
      });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    return safeApiError(error);
  }
}
