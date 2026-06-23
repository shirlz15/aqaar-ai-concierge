import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { readValidatedJson, safeApiError } from "@/lib/security";
import { trackAnalyticsEvent } from "@/lib/server/analytics-store";

const analyticsSchema = z.object({
  type: z.string().min(2).max(80).regex(/^[a-z0-9_:-]+$/),
  metadata: z.record(z.unknown()).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await readValidatedJson(request, analyticsSchema);
    const event = trackAnalyticsEvent(payload.type, payload.metadata);
    return NextResponse.json({ ok: true, id: event.id });
  } catch (error) {
    return safeApiError(error);
  }
}
