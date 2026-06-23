import { PropertyCard } from "@/components/property-card";
import { ArrowRight, Building2 } from "lucide-react";
import { getKnowledgeBase } from "@/lib/server/knowledge-base";

export function FeaturedProjects() {
  const knowledge = getKnowledgeBase();
  const projects = knowledge.projectsMaster.slice(0, 6);

  return (
    <section id="projects" className="relative bg-aqaar-dark py-24">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 bg-section-gradient" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
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

        {/* Property grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <PropertyCard
              key={project.project_name as string}
              project={project}
              priority={index < 3}
              featured={index === 0}
              index={index}
            />
          ))}
        </div>

        {/* Bottom separator */}
        <div className="separator-lime mt-20" />
      </div>
    </section>
  );
}
