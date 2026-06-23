"use client";

import { useEffect, useRef, useState } from "react";
import { PropertyCard } from "@/components/property-card";
import { ArrowRight, Building2, Home, Layers } from "lucide-react";
import type { CsvRow } from "@/lib/server/csv";

const tabs = [
  { label: "All", icon: Layers },
  { label: "Buy", icon: Home },
  { label: "Rent", icon: Building2 },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targets = el.querySelectorAll("[data-reveal]");
            targets.forEach((t, i) => {
              setTimeout(() => t.classList.add("revealed"), i * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

type Props = {
  projects: CsvRow[];
};

export function FeaturedProjectsClient({ projects }: Props) {
  const [activeTab, setActiveTab] = useState("All");
  const revealRef = useScrollReveal();

  const filtered = projects.filter((p) => {
    if (activeTab === "All") return true;
    const type = ((p.project_type as string) || "").toLowerCase();
    if (activeTab === "Buy") return !type.includes("rent");
    if (activeTab === "Rent") return type.includes("rent");
    return true;
  });

  return (
    <section id="projects" className="relative bg-aqaar-dark py-24" ref={revealRef}>
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 bg-section-gradient" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div
          className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
          data-reveal
        >
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px w-8 bg-aqaar-lime" />
              <span className="text-xs font-bold uppercase tracking-widest text-aqaar-lime">
                Project Showcase
              </span>
            </div>
            <h2
              className="font-display text-4xl font-bold text-white md:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Curated Aqaar
              <br />
              <span className="italic text-aqaar-lime">Opportunities</span>
            </h2>
            <p className="mt-4 max-w-md text-base text-white/55">
              Each property is selected for its investment potential, lifestyle
              premium, and location advantage within Ajman's master plan.
            </p>
          </div>
          <a
            id="view-all-projects-btn"
            href="#concierge"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-aqaar-line bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-aqaar-lime/30 hover:bg-aqaar-lime/10 hover:text-aqaar-lime"
          >
            <Building2 className="h-4 w-4" />
            View All with AI
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* BUY / RENT filter tabs */}
        <div className="mb-8 flex items-center gap-2" data-reveal>
          <div className="glass inline-flex rounded-xl p-1 gap-1">
            {tabs.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  activeTab === label
                    ? "bg-aqaar-lime text-aqaar-dark shadow-lime-sm"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/40 ml-2">{filtered.length} properties</span>
        </div>

        {/* Property grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project, index) => (
            <div
              key={project.project_name as string}
              data-reveal
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <PropertyCard
                project={project}
                priority={index < 3}
                featured={index === 0 && activeTab === "All"}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Bottom separator */}
        <div className="separator-lime mt-20" />
      </div>
    </section>
  );
}
