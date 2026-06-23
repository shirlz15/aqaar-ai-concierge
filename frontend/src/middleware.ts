import { NextRequest, NextResponse } from "next/server";

async function signSession(secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("aqaar-admin-session"));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login") {
    const session = request.cookies.get("aqaar_admin_session")?.value;
    const expected = process.env.ADMIN_DASHBOARD_TOKEN ? await signSession(process.env.ADMIN_DASHBOARD_TOKEN) : "";
    if (!expected || session !== expected) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
