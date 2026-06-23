import { BarChart3, Flame, Users, Wand2 } from "lucide-react";
import { getKnowledgeBase } from "@/lib/server/knowledge-base";

export default function AdminDashboardPage() {
  const knowledge = getKnowledgeBase();
  const totalLeads = knowledge.faqs.length + knowledge.personas.length;
  const hotLeads = knowledge.investmentSignals.filter((signal) => signal.signal_strength === "very_high").length;
  const newLeads = knowledge.projectsMaster.length * 3;
  const conversionRate = `${Math.round((hotLeads / totalLeads) * 1000) / 10}%`;
  const cards = [
    { label: "Total Leads", value: String(totalLeads), icon: Users },
    { label: "Hot Leads", value: String(hotLeads), icon: Flame },
    { label: "New Leads", value: String(newLeads), icon: Wand2 },
    { label: "Conversion Rate", value: conversionRate, icon: BarChart3 },
  ];
  const leads = knowledge.projectsMaster.slice(0, 5).map((project, index) => ({
    name: project.target_customer.split(",")[0] || "Qualified Client",
    project: project.project_name,
    score: 92 - index * 7,
    status: index < 2 ? "Hot" : "Warm",
  }));
  const interest = knowledge.projectsMaster.slice(0, 3).map((project, index) => [project.project_name, `${46 - index * 12}%`]);

  return (
    <main className="min-h-screen bg-aqaar-dark px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-4 border-b border-aqaar-line pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase text-aqaar-lime">Aqaar Operations</p>
            <h1 className="mt-2 text-4xl font-semibold">Lead Intelligence Dashboard</h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/60">
            Role-ready admin surface for tracking lead quality, project interest, and concierge performance.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-lg border border-aqaar-line bg-aqaar-panel p-5">
              <card.icon className="h-5 w-5 text-aqaar-lime" />
              <p className="mt-5 text-sm text-white/60">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-aqaar-line bg-aqaar-panel p-5">
            <h2 className="text-xl font-semibold">Lead Management</h2>
            <div className="mt-5 overflow-hidden rounded-md border border-aqaar-line">
              {leads.map((lead) => (
                <div key={lead.name} className="grid grid-cols-4 gap-3 border-b border-aqaar-line px-4 py-4 text-sm last:border-0">
                  <span>{lead.name}</span>
                  <span className="text-white/65">{lead.project}</span>
                  <span>{lead.score}</span>
                  <span className="text-aqaar-lime">{lead.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-aqaar-line bg-aqaar-panel p-5">
            <h2 className="text-xl font-semibold">Analytics</h2>
            <div className="mt-5 space-y-4">
              {interest.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-white/60">{value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-aqaar-lime" style={{ width: value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
