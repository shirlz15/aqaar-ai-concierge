import { ArrowRight, Building2, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { ConciergeWidget } from "@/components/concierge-widget";
import { Button } from "@/components/ui/button";
import { getKnowledgeBase } from "@/lib/server/knowledge-base";

export default function HomePage() {
  const knowledge = getKnowledgeBase();
  const projects = knowledge.projectsMaster.slice(0, 3);
  const heroProject = projects[0];

  return (
    <main className="min-h-screen bg-aqaar-dark">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="text-xl font-semibold tracking-wide">Aqaar</div>
        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#projects" className="hover:text-white">Projects</a>
          <a href="#intelligence" className="hover:text-white">Concierge</a>
          <a href="/admin" className="hover:text-white">Admin</a>
        </div>
        <Button className="hidden md:inline-flex">Book Consultation</Button>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.04fr_0.96fr] lg:pt-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-aqaar-line px-3 py-2 text-sm text-white/70">
            <Sparkles className="h-4 w-4 text-aqaar-lime" />
            Luxury real estate intelligence
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">Aqaar AI Concierge</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            A professional advisory layer for discovering Aqaar properties, qualifying interest, and matching buyers with high-value opportunities.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button>
              Start Concierge <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost">Explore Projects</Button>
          </div>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-aqaar-line bg-aqaar-panel">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(214,228,28,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
          <div className="relative flex h-full flex-col justify-end p-8">
            <div className="rounded-md border border-aqaar-line bg-aqaar-dark/85 p-5 backdrop-blur">
              <p className="text-sm text-aqaar-lime">Featured Opportunity</p>
              <h2 className="mt-2 text-2xl font-semibold">{heroProject.project_name} at {heroProject.location}</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {heroProject.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="border-y border-aqaar-line bg-aqaar-panel/70 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm uppercase text-aqaar-lime">Project Showcase</p>
              <h2 className="mt-2 text-3xl font-semibold">Curated Aqaar opportunities</h2>
            </div>
            <Building2 className="h-8 w-8 text-aqaar-lime" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <article key={project.project_name} className="rounded-lg border border-aqaar-line bg-aqaar-dark p-5">
                <div className="mb-10 flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4 text-aqaar-lime" />
                  {project.location}
                </div>
                <h3 className="text-2xl font-semibold">{project.project_name}</h3>
                <p className="mt-1 text-sm text-aqaar-lime">{project.project_type}</p>
                <p className="mt-4 text-sm leading-6 text-white/65">{project.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="intelligence" className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-3">
        {["Intent discovery", "Lead scoring", "Secure data flow"].map((item) => (
          <div key={item} className="flex gap-4">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-aqaar-lime" />
            <div>
              <h3 className="font-semibold">{item}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Built for advisory conversations, privacy-aware lead capture, and audit-ready operations.
              </p>
            </div>
          </div>
        ))}
      </section>

      <ConciergeWidget />
    </main>
  );
}
