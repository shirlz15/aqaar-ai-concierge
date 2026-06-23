import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { adminLoginSchema } from "@/lib/validation";
import { readValidatedJson, safeApiError } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const { token } = await readValidatedJson(request, adminLoginSchema);
    if (!process.env.ADMIN_DASHBOARD_TOKEN || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    const signature = createHmac("sha256", process.env.ADMIN_DASHBOARD_TOKEN).update("aqaar-admin-session").digest("hex");
    response.cookies.set("aqaar_admin_session", signature, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    return safeApiError(error);
  }
}
