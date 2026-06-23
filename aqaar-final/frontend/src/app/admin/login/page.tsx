"use client";

import { FormEvent, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (response.ok) {
      window.location.href = "/admin";
      return;
    }
    setError("Access could not be verified.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-aqaar-dark px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-aqaar-line bg-aqaar-panel p-6">
        <Lock className="mb-4 h-6 w-6 text-aqaar-lime" />
        <h1 className="text-2xl font-semibold">Admin Access</h1>
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="mt-6 h-11 w-full rounded-md border border-aqaar-line bg-aqaar-dark px-3 outline-none focus:border-aqaar-lime"
          placeholder="Secure access token"
        />
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <Button className="mt-5 w-full">Continue</Button>
      </form>
    </main>
  );
}
