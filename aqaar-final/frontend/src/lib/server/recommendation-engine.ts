import { scoreLead } from "@/lib/lead-scoring";
import type { ConciergeProfile } from "@/lib/validation";
import type { KnowledgeBase } from "./knowledge-base";

export type PropertyRecommendation = {
  project_name: string;
  project_type: string;
  match_score: number;
  why_recommended: string;
  investment_potential: string;
  estimated_roi: string;
  sales_pitch: string;
  keywords: string;
};

export function recommendProperties(profile: ConciergeProfile, knowledge: KnowledgeBase): PropertyRecommendation[] {
  return knowledge.projectsMaster
    .map((project) => {
      let score = 55;
      const keywordText = `${project.project_name} ${project.project_type} ${project.location} ${project.keywords} ${project.target_customer}`.toLowerCase();
      if (profile.project_name && project.project_name === profile.project_name) score += 28;
      if (profile.location && project.location.toLowerCase().includes(profile.location.toLowerCase())) score += 18;
      if (profile.property_type && keywordText.includes(profile.property_type.toLowerCase())) score += 15;
      if (profile.investment_interest && /invest|rental|roi|yield|capital/.test(keywordText + project.investment_angle.toLowerCase())) score += 12;
      if (profile.intent === "commercial" && /commercial|office|retail|showroom/.test(keywordText)) score += 20;
      if (profile.intent === "rent" && /rental|apartment|serviced/.test(keywordText)) score += 10;
      const signal = knowledge.investmentSignals.find((item) => item.project_name === project.project_name);
      return {
        project_name: project.project_name,
        project_type: project.project_type,
        match_score: Math.min(score, 99),
        why_recommended: project.description,
        investment_potential: project.investment_angle,
        estimated_roi: signal?.roi_band || "Available on advisor review",
        sales_pitch: project.sales_pitch,
        keywords: project.keywords,
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3);
}

export function nextConciergeReply(profile: ConciergeProfile, recommendations: PropertyRecommendation[], knowledge: KnowledgeBase) {
  if (!profile.intent) return "Thank you for your interest. Are you considering buying, renting, investing, or commercial property?";
  if (!profile.location) return knowledge.salesLanguage.follow_ups[0];
  if (!profile.property_type) return "May I know which property type you prefer, such as an apartment, villa, branded residence, or commercial space?";
  if (!profile.budget) return knowledge.salesLanguage.follow_ups[1];
  if (!profile.timeline) return knowledge.salesLanguage.follow_ups[2];
  const top = recommendations[0];
  if (!top) return "Thank you. I can refine the shortlist once I understand your preferred location and budget.";
  return `${top.project_name} appears well aligned with your requirements. ${top.sales_pitch} Would you like Aqaar to arrange a private consultation for the current availability and pricing?`;
}

export function leadSummary(profile: ConciergeProfile) {
  const { score, leadCategory } = scoreLead(profile, false);
  return { lead_score: score, lead_category: leadCategory };
}
