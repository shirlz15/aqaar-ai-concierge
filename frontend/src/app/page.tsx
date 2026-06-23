import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeaturedProjects } from "@/components/featured-projects";
import { ProjectSpotlights } from "@/components/project-spotlights";
import { InvestmentSection } from "@/components/investment-section";
import { ConciergeSection } from "@/components/concierge-section";
import { ConciergeWidget } from "@/components/concierge-widget";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-aqaar-dark">
      <Navbar />
      <HeroSection />
      <FeaturedProjects />
      <ProjectSpotlights />
      <InvestmentSection />
      <ConciergeSection />
      <Footer />
      <ConciergeWidget />
    </main>
  );
}
