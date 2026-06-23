import type { ConciergeProfile } from "./validation";

export function scoreLead(profile: ConciergeProfile, hasPhone = false) {
  let score = 0;
  if (profile.location) score += 20;
  if (profile.budget) score += 25;
  if (profile.timeline) score += 20;
  if (hasPhone) score += 35;
  const leadCategory = score >= 75 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  return { score: Math.min(score, 100), leadCategory };
}
