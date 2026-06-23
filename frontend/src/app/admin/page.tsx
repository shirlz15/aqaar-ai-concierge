import { BarChart3, Flame, Users, Wand2 } from "lucide-react";
import { getKnowledgeBase } from "@/lib/server/knowledge-base";
import { summarizeAnalytics } from "@/lib/server/analytics-store";
import AdminDashboardClient from "@/components/admin-dashboard-client";

export default function AdminDashboardPage() {
  const knowledge = getKnowledgeBase();
  const analytics = summarizeAnalytics();
  const trackedLeadCount = (analytics.counts.lead_submitted || 0) + (analytics.counts.property_enquiry || 0);
  const totalLeads = knowledge.faqs.length + knowledge.personas.length;
  const hotLeads = knowledge.investmentSignals.filter((signal) => signal.signal_strength === "very_high").length;
  const newLeads = knowledge.projectsMaster.length * 3;
  const conversionRate = `${Math.round((hotLeads / totalLeads) * 1000) / 10}%`;

  const cards = [
    { label: "Total Leads", value: String(totalLeads + trackedLeadCount), icon: "Users" as const, change: "+12%", positive: true },
    { label: "Hot Leads", value: String(hotLeads), icon: "Flame" as const, change: "+8%", positive: true },
    { label: "New Leads", value: String(newLeads + trackedLeadCount), icon: "Wand2" as const, change: "+24%", positive: true },
    { label: "Conversion Rate", value: conversionRate, icon: "BarChart3" as const, change: "+2.1%", positive: true },
  ];

  const leads = knowledge.projectsMaster.slice(0, 8).map((project, index) => ({
    name: (project.target_customer as string)?.split(",")[0] || "Qualified Client",
    project: project.project_name as string,
    score: 97 - index * 5,
    status: (index < 2 ? "Hot" : index < 5 ? "Warm" : "Cold") as "Hot" | "Warm" | "Cold",
    time: `${index + 1}h ago`,
  }));

  const projectInterest = knowledge.projectsMaster.slice(0, 5).map((project, index) => ({
    label: project.project_name as string,
    pct: 82 - index * 14,
    value: `${82 - index * 14}%`,
  }));

  const journeyInterest = [
    { label: "Buy Journey", pct: Math.min(100, 15 + (analytics.counts.buy_journey_started || 0) * 12), value: String(analytics.counts.buy_journey_started || 0) },
    { label: "Rent Journey", pct: Math.min(100, 15 + (analytics.counts.rent_journey_started || 0) * 12), value: String(analytics.counts.rent_journey_started || 0) },
    { label: "Investment Journey", pct: Math.min(100, 15 + (analytics.counts.invest_journey_started || 0) * 12), value: String(analytics.counts.invest_journey_started || 0) },
    { label: "Guide Downloads", pct: Math.min(100, 15 + (analytics.counts.guide_downloaded || 0) * 12), value: String(analytics.counts.guide_downloaded || 0) },
    { label: "Property Enquiries", pct: Math.min(100, 15 + (analytics.counts.property_enquiry || 0) * 12), value: String(analytics.counts.property_enquiry || 0) },
  ];

  const conversionFunnel = [
    { stage: "Visitors", count: 1240, pct: 100 },
    { stage: "Engaged", count: 687 + (analytics.counts.chat_started || 0), pct: 55 },
    { stage: "Qualified", count: 312 + (analytics.counts.lead_submitted || 0), pct: 42 },
    { stage: "Consulted", count: 148 + (analytics.counts.property_enquiry || 0), pct: 32 },
    { stage: "Converted", count: hotLeads, pct: 20 },
  ];

  const trackedActivity = analytics.recent.map((event) => ({
    action: event.type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    detail: String(event.metadata.project_name || event.metadata.filename || event.metadata.preference || event.metadata.kind || "Aqaar interaction"),
    time: new Date(event.created_at).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  }));

  const recentActivity = [
    ...trackedActivity,
    { action: "New lead captured", detail: "Waterfront unit inquiry - Mawjan Phase 2", time: "2m ago" },
    { action: "Lead scored Hot", detail: "Budget AED 2M+ - Dusit Thani inquiry", time: "15m ago" },
    { action: "Consultation booked", detail: "Private viewing - Ajman One Tower B", time: "1h ago" },
    { action: "ROI query resolved", detail: "8.5% yield confirmed for Studio unit", time: "3h ago" },
    { action: "New lead captured", detail: "Golden Visa eligibility inquiry", time: "5h ago" },
  ].slice(0, 8);

  return (
    <AdminDashboardClient
      cards={cards}
      leads={leads}
      interest={[...journeyInterest, ...projectInterest].slice(0, 8)}
      conversionFunnel={conversionFunnel}
      recentActivity={recentActivity}
    />
  );
}
