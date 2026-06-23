"use client";

import { useEffect, useRef } from "react";
import { Sparkles, MessageSquare, Clock, Shield, ArrowRight } from "lucide-react";

const capabilities = [
  {
    icon: MessageSquare,
    title: "Natural Conversation",
    desc: "Describe what you're looking for in plain language — budget, lifestyle, goals.",
  },
  {
    icon: Sparkles,
    title: "AI Matching",
    desc: "Instantly matched with the most relevant Aqaar properties and investment profiles.",
  },
  {
    icon: Clock,
    title: "Real-time Advisory",
    desc: "Get live ROI projections, market insights, and payment plan breakdowns.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    desc: "Your data is handled with full consent-based, GDPR-compliant security.",
  },
];

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.querySelectorAll("[data-reveal]").forEach((t, i) => {
              setTimeout(() => t.classList.add("revealed"), i * 120);
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

export function ConciergeSection() {
  const revealRef = useReveal();

  return (
    <section id="concierge" className="relative bg-aqaar-deeper py-24 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqaar-lime/5 blur-3xl" />

      <div ref={revealRef} className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left content */}
          <div data-reveal="left">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px w-8 bg-aqaar-lime" />
              <span className="text-xs font-bold uppercase tracking-widest text-aqaar-lime">
                AI Concierge
              </span>
            </div>
            <h2
              className="font-display text-4xl font-bold text-white md:text-5xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your Personal
              <br />
              <span className="italic text-aqaar-lime">Property Advisor</span>
            </h2>
            <p className="mt-5 max-w-md leading-7 text-white/55">
              The Aqaar AI Concierge is not a chatbot — it is a sophisticated
              advisory engine trained on every Aqaar property, buyer profile,
              and market signal. Ready to guide you to your ideal investment.
            </p>

            {/* Capabilities */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aqaar-lime/10 transition-all group-hover:bg-aqaar-lime/20">
                    <Icon className="h-4 w-4 text-aqaar-lime group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — chat preview mockup */}
          <div className="relative float-slow" data-reveal="right">
            <div className="rounded-2xl border border-aqaar-line bg-aqaar-card shadow-concierge overflow-hidden">
              {/* Header */}
              <div className="relative overflow-hidden border-b border-aqaar-line bg-aqaar-panel px-5 py-4">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-aqaar-lime via-aqaar-lime/50 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-aqaar-lime">
                    <Sparkles className="h-5 w-5 text-aqaar-dark" />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-aqaar-panel bg-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Aqaar AI Advisor</p>
                    <p className="text-xs text-aqaar-lime flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                      Online — Ready to assist
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview messages */}
              <div className="space-y-4 px-5 py-5">
                {/* Bot message 1 */}
                <div className="flex gap-2 msg-in-left">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aqaar-lime">
                    <Sparkles className="h-3 w-3 text-aqaar-dark" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-aqaar-line bg-aqaar-panel px-4 py-3 text-sm text-white/80 max-w-[85%]">
                    Welcome to Aqaar AI Concierge. I can help you find the perfect property in Ajman. What&apos;s your investment goal?
                  </div>
                </div>

                {/* User message */}
                <div className="flex flex-row-reverse gap-2 msg-in-right" style={{ animationDelay: "200ms" }}>
                  <div className="rounded-2xl rounded-tr-sm bg-aqaar-lime px-4 py-3 text-sm font-medium text-aqaar-dark max-w-[75%]">
                    I&apos;m looking for a waterfront apartment with strong ROI potential.
                  </div>
                </div>

                {/* Bot response */}
                <div className="flex gap-2 msg-in-left" style={{ animationDelay: "400ms" }}>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aqaar-lime">
                    <Sparkles className="h-3 w-3 text-aqaar-dark" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-aqaar-line bg-aqaar-panel px-4 py-3 text-sm text-white/80 max-w-[85%]">
                    Excellent! Based on your criteria, I recommend{" "}
                    <span className="font-semibold text-aqaar-lime">Mawjan</span> — an 8-10%
                    ROI waterfront development, and{" "}
                    <span className="font-semibold text-aqaar-lime">Dusit Thani Residences</span>{" "}
                    for a branded luxury option. Shall I provide a detailed comparison?
                  </div>
                </div>

                {/* Recommendation preview card */}
                <div className="rounded-xl border border-aqaar-lime/20 bg-aqaar-lime/5 p-4 msg-in-left" style={{ animationDelay: "600ms" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Mawjan Waterfront</p>
                      <p className="text-xs text-aqaar-lime">High ROI Potential</p>
                    </div>
                    <div className="rounded-full bg-aqaar-lime px-3 py-1">
                      <span className="text-[11px] font-bold text-aqaar-dark">94% match</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/50">Est. ROI: 8-10% — Starting AED 680K</p>
                </div>
              </div>

              {/* Input preview */}
              <div className="border-t border-aqaar-line px-5 pb-5 pt-4">
                <div className="flex gap-2">
                  <div className="flex-1 rounded-xl border border-aqaar-line bg-aqaar-darker px-4 py-2.5 text-sm text-white/30">
                    Ask about any property...
                  </div>
                  <button
                    id="concierge-section-open-btn"
                    onClick={() => {
                      const fab = document.getElementById("concierge-fab-btn");
                      if (fab) fab.click();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqaar-lime text-aqaar-dark hover:bg-aqaar-lime-soft transition-all hover:shadow-lime-sm"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-white/30">
                  Click the{" "}
                  <span className="text-aqaar-lime">✦</span> button in the corner to start
                </p>
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="absolute -right-4 -top-4 glass rounded-xl border border-aqaar-lime/20 p-3 shadow-lime-sm float-slow">
              <p className="text-xl font-bold text-aqaar-lime">3200+</p>
              <p className="text-[10px] text-white/50">Satisfied Investors</p>
            </div>

            {/* Floating trust badge */}
            <div className="absolute -left-4 -bottom-4 glass rounded-xl border border-white/10 p-3">
              <p className="text-xs font-semibold text-white/80">🏛 Official Authority</p>
              <p className="text-[10px] text-white/40 mt-0.5">Ajman, UAE</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
