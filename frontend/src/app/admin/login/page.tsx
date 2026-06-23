"use client";

import { FormEvent, useState } from "react";
import { Lock, Sparkles, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { showToast } from "@/components/toast-provider";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (response.ok) {
        showToast("Admin login", "Access verified. Opening dashboard.", "success");
        window.location.href = "/admin";
        return;
      }
      setError("Access could not be verified. Please check your credentials.");
      showToast("Admin login failed", "Please check your credentials and server environment.", "error");
    } catch {
      setError("Unable to connect. Please try again.");
      showToast("Error occurred", "Unable to connect. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-aqaar-deeper px-6 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/images/ajman_skyline.png"
          alt="Ajman skyline"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-aqaar-deeper via-aqaar-deeper/70 to-aqaar-deeper" />
      </div>

      {/* Ambient glow */}
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqaar-lime/5 blur-3xl pointer-events-none" />

      {/* Login card */}
      <div className="relative w-full max-w-sm">
        {/* Top accent bar */}
        <div className="absolute -top-px left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-aqaar-lime via-aqaar-lime/50 to-transparent" />

        <div className="rounded-2xl border border-aqaar-line bg-aqaar-card p-8 shadow-concierge">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aqaar-lime">
                <Sparkles className="h-7 w-7 text-aqaar-dark" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span
                className="font-display text-2xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Aqaar
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-aqaar-lime inline-block" />
            </div>
            <p className="mt-1 text-sm text-white/40">Operations Center</p>
          </div>

          {/* Divider */}
          <div className="separator-lime mb-6" />

          <h1 className="text-lg font-bold text-white">Secure Access</h1>
          <p className="mt-1 text-sm text-white/40">
            Enter your admin access token to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="h-4 w-4 text-white/30" />
              </div>
              <input
                id="admin-token-input"
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="h-12 w-full rounded-xl border border-aqaar-line bg-aqaar-darker pl-10 pr-12 text-sm text-white outline-none placeholder:text-white/25 focus:border-aqaar-lime transition-colors"
                placeholder="Access token"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading || !token}
              className="relative w-full overflow-hidden rounded-xl bg-aqaar-lime py-3 text-sm font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-aqaar-dark/30 border-t-aqaar-dark" />
                  Verifying...
                </span>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/25">
            Protected by Aqaar Security Framework
          </p>
        </div>
      </div>
    </main>
  );
}
