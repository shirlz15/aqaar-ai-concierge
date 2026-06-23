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
      if (profile.intent === "buy" && /buy|ownership|family|villa|apartment|branded/.test(keywordText)) score += 10;
      if (profile.intent === "invest" && /investment|roi|yield|rental|waterfront/.test(keywordText)) score += 18;
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
  if (profile.intent === "buy") {
    if (!profile.budget) return "Excellent. For a purchase journey, may I know your approximate budget range and whether you prefer an apartment, villa, or branded residence?";
    if (!profile.property_type) return "Which property type should I focus on for you: apartment, villa, branded residence, or waterfront home?";
    if (!profile.location) return "Do you prefer Ajman Waterfront, the Corniche, a family community, or a business district?";
    if (!profile.timeline) return "What is your ideal purchase timeline: immediate, 1-3 months, or later this year?";
  }
  if (profile.intent === "rent") {
    if (!profile.budget) return "For the rental journey, what monthly budget range would feel comfortable?";
    if (!profile.property_type) return "Would you like a studio, apartment, villa, or serviced residence for rent?";
    if (!profile.location) return "Which area suits you best: waterfront, family community, or close to business access?";
    if (!profile.timeline) return "When would you like to move in, and how long is your preferred lease duration?";
  }
  if (profile.intent === "invest") {
    if (!profile.budget) return "For investment, what capital range are you considering, and do you prefer income yield or capital appreciation?";
    if (!profile.location) return "Would you like me to focus on waterfront rental demand, branded residences, or commercial yield opportunities?";
    if (!profile.timeline) return "What is your investment horizon: short-term rental income, 3-5 year growth, or long-term capital preservation?";
  }
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
