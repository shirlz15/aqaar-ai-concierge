import { z } from "zod";

export const conciergeProfileSchema = z.object({
  intent: z.string().max(80).optional().nullable(),
  property_type: z.string().max(80).optional().nullable(),
  project_name: z.string().max(120).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  budget: z.string().max(120).optional().nullable(),
  timeline: z.string().max(120).optional().nullable(),
  investment_interest: z.boolean().optional().nullable(),
  urgency: z.enum(["low", "medium", "high"]).optional().nullable(),
  persona: z.string().max(80).optional().nullable(),
  selected_project: z.string().max(120).optional().nullable(),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  session_id: z.string().min(8).max(128),
  message: z.string().trim().min(1).max(2000),
  history: z.array(chatMessageSchema).max(20).default([]),
  profile: conciergeProfileSchema.default({}),
});

export const leadRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().min(7).max(30).regex(/^[+\d\s().-]+$/),
  preferred_contact_method: z.enum(["phone", "email", "whatsapp"]),
  preference: z.string().trim().min(2).max(160).optional(),
  selected_project: z.string().trim().max(120).optional(),
  consent_given: z.literal(true),
  session_id: z.string().min(8).max(128),
  profile: conciergeProfileSchema.default({}),
});

export const adminLoginSchema = z.object({
  token: z.string().min(16).max(256),
});

export type ConciergeProfile = z.infer<typeof conciergeProfileSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
