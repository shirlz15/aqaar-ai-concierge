import { NextRequest } from "next/server";

export function resolveBackendUrl(): string | null {
  const configured = process.env.BACKEND_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://127.0.0.1:8000";
}

export function buildProxyHeaders(request: NextRequest) {
  return {
    "Content-Type": "application/json",
    "User-Agent": request.headers.get("user-agent") || "aqaar-frontend",
  };
}
