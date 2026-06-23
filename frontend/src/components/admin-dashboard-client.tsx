"use client";

import { useState } from "react";
import {
  BarChart3,
  Flame,
  Users,
  Wand2,
  TrendingUp,
  ArrowUpRight,
  Home,
  LogOut,
  Settings,
  Bell,
  Activity,
  ChevronRight,
} from "lucide-react";

type Lead = {
  name: string;
  project: string;
  score: number;
  status: "Hot" | "Warm" | "Cold";
  time: string;
};

type Card = {
  label: string;
  value: string;
  icon: "Users" | "Flame" | "Wand2" | "BarChart3";
  change: string;
  positive: boolean;
};

type InterestItem = {
  label: string;
  pct: number;
  value: string;
};

const navItems = [
  { icon: BarChart3, label: "Dashboard", active: true },
  { icon: Users, label: "Leads", active: false },
  { icon: Activity, label: "Analytics", active: false },
  { icon: Home, label: "Properties", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export default function AdminDashboardClient({
  cards,
  leads,
  interest,
  conversionFunnel,
  recentActivity,
}: {
  cards: Card[];
  leads: Lead[];
  interest: InterestItem[];
  conversionFunnel: { stage: string; count: number; pct: number }[];
  recentActivity: { action: string; detail: string; time: string }[];
}) {
  const [activeNav, setActiveNav] = useState("Dashboard");

  return (
    <div className="flex min-h-screen bg-aqaar-darker">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-aqaar-line bg-aqaar-deeper lg:flex">
        {/* Logo */}
        <div className="border-b border-aqaar-line px-6 py-6">
          <div className="flex items-baseline gap-0.5">
            <span
              className="font-display text-xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Aqaar
            </span>
            <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-aqaar-lime inline-block mb-0.5" />
          </div>
          <p className="mt-0.5 text-[11px] text-white/40">Operations Center</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              id={`sidebar-${label.toLowerCase()}-btn`}
              onClick={() => setActiveNav(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                activeNav === label
                  ? "bg-aqaar-lime/10 text-aqaar-lime"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {activeNav === label && (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-aqaar-line px-3 py-4">
          <a
            href="/"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/50 hover:bg-white/5 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Back to Site
          </a>
          <button
            id="admin-logout-btn"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/30 hover:bg-white/5 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 border-b border-aqaar-line bg-aqaar-deeper/90 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-aqaar-lime">
                Aqaar Operations
              </p>
              <h1
                className="mt-0.5 font-display text-2xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Lead Intelligence Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                id="admin-notifications-btn"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-aqaar-line bg-white/5 text-white/60 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-aqaar-lime" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-aqaar-lime">
                <span className="text-xs font-bold text-aqaar-dark">AQ</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const iconMap = { Users, Flame, Wand2, BarChart3 };
              const Icon = iconMap[card.icon];
              return (
                <div
                  key={card.label}
                  id={`kpi-${card.label.toLowerCase().replace(/ /g, "-")}`}
                  className="group rounded-2xl border border-aqaar-line bg-aqaar-card p-5 transition-all hover:border-aqaar-lime/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqaar-lime/10">
                      <Icon className="h-5 w-5 text-aqaar-lime" />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        card.positive ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      <ArrowUpRight
                        className={`h-3.5 w-3.5 ${!card.positive && "rotate-90"}`}
                      />
                      {card.change}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-white/50">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{card.value}</p>
                </div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Lead management table */}
            <div className="rounded-2xl border border-aqaar-line bg-aqaar-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Lead Management</h2>
                <button
                  id="export-leads-btn"
                  className="text-xs font-medium text-aqaar-lime hover:underline"
                >
                  Export CSV
                </button>
              </div>

              {/* Table header */}
              <div className="mb-3 grid grid-cols-4 gap-3 px-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                <span>Prospect</span>
                <span>Project</span>
                <span>Score</span>
                <span>Status</span>
              </div>

              <div className="divide-y divide-aqaar-line overflow-hidden rounded-xl border border-aqaar-line">
                {leads.map((lead, i) => (
                  <div
                    key={lead.name}
                    id={`lead-row-${i}`}
                    className="grid grid-cols-4 items-center gap-3 px-4 py-4 text-sm transition-colors hover:bg-white/[0.02]"
                  >
                    <span className="font-medium text-white truncate">{lead.name}</span>
                    <span className="text-white/50 text-xs truncate">{lead.project}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-aqaar-lime bar-animate"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{lead.score}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        lead.status === "Hot"
                          ? "bg-red-500/15 text-red-400"
                          : lead.status === "Warm"
                          ? "bg-aqaar-lime/15 text-aqaar-lime"
                          : "bg-white/10 text-white/40"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          lead.status === "Hot"
                            ? "bg-red-400"
                            : lead.status === "Warm"
                            ? "bg-aqaar-lime"
                            : "bg-white/30"
                        }`}
                      />
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Interest analytics */}
              <div className="rounded-2xl border border-aqaar-line bg-aqaar-card p-6">
                <h2 className="mb-5 text-lg font-bold text-white">Intent Analytics</h2>
                <div className="space-y-4">
                  {interest.map(({ label, pct, value }) => (
                    <div key={label}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <span className="text-white/70 truncate">{label}</span>
                        <span className="shrink-0 text-xs font-semibold text-aqaar-lime">
                          {value}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-1.5 rounded-full bg-aqaar-lime bar-animate"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion funnel */}
              <div className="rounded-2xl border border-aqaar-line bg-aqaar-card p-6">
                <h2 className="mb-5 text-lg font-bold text-white">Conversion Funnel</h2>
                <div className="space-y-3">
                  {conversionFunnel.map(({ stage, count, pct }) => (
                    <div key={stage} className="flex items-center gap-3">
                      <div
                        className="flex h-8 flex-1 items-center rounded-lg px-3 text-xs font-medium text-aqaar-dark transition-all"
                        style={{
                          width: `${pct}%`,
                          minWidth: "40%",
                          background: `linear-gradient(90deg, #D6E41C ${pct}%, rgba(214,228,28,0.1) 100%)`,
                        }}
                      >
                        {stage}
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-bold text-white/60">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity feed */}
          <div className="mt-6 rounded-2xl border border-aqaar-line bg-aqaar-card p-6">
            <h2 className="mb-5 text-lg font-bold text-white">Recent Activity</h2>
            <div className="divide-y divide-aqaar-line">
              {recentActivity.map(({ action, detail, time }, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aqaar-lime/10">
                    <Activity className="h-4 w-4 text-aqaar-lime" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{action}</p>
                    <p className="text-xs text-white/40">{detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-white/30">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
