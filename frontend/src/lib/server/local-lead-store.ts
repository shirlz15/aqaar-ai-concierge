import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { z } from "zod";
import type { leadRequestSchema } from "@/lib/validation";

type LeadPayload = z.infer<typeof leadRequestSchema>;

function redactContact(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function storeLocalLead(payload: LeadPayload, leadScore: number, leadCategory: string) {
  const id = `local-${randomUUID()}`;
  const storageDir = path.join(process.cwd(), "..", ".local-data");
  mkdirSync(storageDir, { recursive: true });
  const record = {
    id,
    created_at: new Date().toISOString(),
    name: payload.name,
    email_hash: redactContact(payload.email),
    phone_hash: redactContact(payload.phone),
    country: payload.country ?? null,
    budget_range: payload.budget_range ?? null,
    preferred_contact_method: payload.preferred_contact_method,
    preference: payload.preference ?? null,
    selected_project: payload.selected_project ?? payload.profile.selected_project ?? payload.profile.project_name ?? null,
    consent_given: payload.consent_given,
    session_id: payload.session_id,
    lead_score: leadScore,
    lead_category: leadCategory,
    profile: payload.profile,
  };
  appendFileSync(path.join(storageDir, "leads.jsonl"), `${JSON.stringify(record)}\n`, "utf8");
  return { id, record };
}
