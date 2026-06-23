import { NextRequest, NextResponse } from "next/server";
import { leadRequestSchema } from "@/lib/validation";
import { auditClientEvent, readValidatedJson, safeApiError } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const payload = await readValidatedJson(request, leadRequestSchema);
    const backendUrl = process.env.BACKEND_API_URL;
    if (!backendUrl) {
      return NextResponse.json({ detail: "Backend API is not configured." }, { status: 503 });
    }
    const response = await fetch(`${backendUrl}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) {
      auditClientEvent("lead_proxy_failed", { status: response.status });
      return NextResponse.json({ detail: "Lead submission is temporarily unavailable." }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    return safeApiError(error);
  }
}
