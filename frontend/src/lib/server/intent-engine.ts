import type { ConciergeProfile } from "@/lib/validation";
import type { KnowledgeBase } from "./knowledge-base";

export type ExtractedIntent = ConciergeProfile & {
  intent_confidence: number;
  persona?: string | null;
};

const intentKeywords = {
  buy: ["buy", "purchase", "own", "ownership", "home"],
  rent: ["rent", "lease", "move in", "monthly"],
  invest: ["invest", "investment", "roi", "yield", "return", "capital"],
  commercial: ["commercial", "office", "retail", "showroom", "business"],
  support: ["handover", "payment", "documents", "eligibility", "service charge"],
};

const propertyKeywords = {
  apartment: ["apartment", "flat", "studio", "1br", "2br", "3br"],
  villa: ["villa", "private", "garden", "pool"],
  "branded residence": ["branded", "serviced", "hotel", "resort", "dusit"],
  commercial: ["office", "retail", "showroom", "commercial"],
  penthouse: ["penthouse"],
};

export function extractIntent(message: string, previous: ConciergeProfile, knowledge: KnowledgeBase): ExtractedIntent {
  const text = message.toLowerCase();
  const profile: ExtractedIntent = { ...previous, intent_confidence: 0.35 };

  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      profile.intent = intent;
      profile.intent_confidence = 0.82;
    }
  }

  for (const [propertyType, keywords] of Object.entries(propertyKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) profile.property_type = propertyType;
  }

  for (const project of knowledge.projectsMaster) {
    if (project.project_name && text.includes(project.project_name.toLowerCase())) {
      profile.project_name = project.project_name;
      profile.location = project.location || profile.location;
      profile.intent_confidence = Math.max(profile.intent_confidence, 0.9);
    }
  }

  for (const location of knowledge.locations.slice(0, 40)) {
    if (location.location_name && text.includes(location.location_name.toLowerCase())) profile.location = location.location_name;
  }

  const budgetMatch = text.match(/(?:omr|rial|budget)?\s?(\d{2,4}(?:,\d{3})?|\d+(?:\.\d+)?)\s?(?:k|thousand|m|million|omr|rial)?/i);
  if (budgetMatch && /\b(omr|rial|budget|k|thousand|million|m)\b/i.test(text)) profile.budget = budgetMatch[0].trim();

  if (/(immediate|now|this month|urgent|as soon)/i.test(message)) {
    profile.timeline = "immediate";
    profile.urgency = "high";
  } else if (/(1-3|three months|quarter|soon)/i.test(message)) {
    profile.timeline = "1-3 months";
    profile.urgency = "medium";
  } else if (/(six months|6 months|next year|later)/i.test(message)) {
    profile.timeline = "6+ months";
    profile.urgency = "low";
  }

  profile.investment_interest = profile.investment_interest || profile.intent === "invest";
  profile.persona = inferPersona(profile, text);
  return profile;
}

function inferPersona(profile: ConciergeProfile, text: string) {
  if (profile.intent === "commercial") return "Commercial Buyer";
  if (profile.intent === "rent") return "Rental Seeker";
  if (profile.investment_interest || profile.intent === "invest") return /foreign|overseas|expat/.test(text) ? "Foreign Investor" : "Investor";
  if (/luxury|premium|private|villa|branded/.test(text)) return "Luxury Buyer";
  return "First Time Buyer";
}
