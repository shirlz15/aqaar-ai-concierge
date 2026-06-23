"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  Shield,
  Globe,
  Landmark,
  ArrowRight,
  CheckCircle2,
  Download,
  CheckCircle,
} from "lucide-react";

const reasons = [
  {
    icon: TrendingUp,
    title: "Tax-Free Returns",
    value: "0%",
    unit: "Property Tax",
    description:
      "The UAE offers zero property tax, capital gains tax, and income tax — maximizing your net investment yield.",
  },
  {
    icon: Shield,
    title: "Government-Backed",
    value: "100%",
    unit: "Govt Entity",
    description:
      "Aqaar is Ajman's official real estate authority — providing unmatched security and regulatory compliance.",
  },
  {
    icon: Globe,
    title: "Golden Visa Eligibility",
    value: "10yr",
    unit: "Residency",
    description:
      "Property investments above AED 2M qualify for the UAE 10-year Golden Visa for investors and families.",
  },
  {
    icon: Landmark,
    title: "Strong Market Growth",
    value: "18%",
    unit: "YoY Growth",
    description:
      "Ajman real estate recorded 18% year-on-year appreciation, outperforming several GCC markets.",
  },
];

const keyFacts = [
  "Strategic location between Dubai and Sharjah",
  "Ajman Free Zone for business establishment",
  "1.2km pristine Corniche beachfront",
  "300+ days of sunshine annually",
  "Growing expat and HNWI population",
  "World-class healthcare & education hubs nearby",
];

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.querySelectorAll("[data-reveal]").forEach((t, i) => {
              setTimeout(() => t.classList.add("revealed"), i * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

export function InvestmentSection() {
  const revealRef = useReveal();
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");

  const handleDownload = () => {
    setDownloadState("loading");
    setTimeout(() => {
      setDownloadState("done");
      setTimeout(() => setDownloadState("idle"), 3000);
    }, 1500);
  };

  return (
    <section id="invest" className="relative bg-aqaar-dark py-24 overflow-hidden" ref={revealRef}>
      {/* Background image */}
      <div className="absolute inset-0 opacity-15">
        <Image
          src="/images/ajman_skyline.png"
          alt="Ajman skyline"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-aqaar-dark via-aqaar-dark/80 to-aqaar-dark" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 max-w-2xl" data-reveal>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px w-8 bg-aqaar-lime" />
            <span className="text-xs font-bold uppercase tracking-widest text-aqaar-lime">
              Investment Intelligence
            </span>
          </div>
          <h2
            className="font-display text-4xl font-bold text-white md:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Why Invest
            <br />
            in <span className="italic text-aqaar-lime">Ajman</span>
          </h2>
          <p className="mt-5 leading-7 text-white/55">
            Ajman is rapidly becoming the GCC's most compelling investment
            destination — combining premium lifestyle, high yields, and
            government-backed security.
          </p>
        </div>

        {/* Reasons grid */}
        <div className="mb-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, value, unit, description }, i) => (
            <div
              key={title}
              data-reveal
              style={{ transitionDelay: `${i * 100}ms` }}
              className="group rounded-2xl border border-aqaar-line bg-aqaar-card p-6 transition-all hover:border-aqaar-lime/30 hover:bg-aqaar-card/80 hover:shadow-glow hover:-translate-y-1"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-aqaar-lime/10 transition-all group-hover:bg-aqaar-lime/20">
                <Icon className="h-5 w-5 text-aqaar-lime group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-4xl font-bold text-aqaar-lime">{value}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                {unit}
              </p>
              <h3 className="mt-3 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
            </div>
          ))}
        </div>

        {/* Two-column lower section */}
        <div className="grid gap-8 lg:grid-cols-2" data-reveal>
          {/* Key facts */}
          <div className="rounded-2xl border border-aqaar-line bg-aqaar-card p-8">
            <h3
              className="font-display text-2xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ajman at a Glance
            </h3>
            <ul className="mt-6 space-y-3">
              {keyFacts.map((fact) => (
                <li key={fact} className="flex items-start gap-3 text-sm text-white/70 hover:text-white/90 transition-colors">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-aqaar-lime" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA card */}
          <div className="relative overflow-hidden rounded-2xl bg-aqaar-lime p-8">
            {/* Decorative circles */}
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 animate-float-slow" />
            <div className="absolute -right-4 -bottom-8 h-32 w-32 rounded-full bg-black/10" />
            <div className="absolute left-8 -bottom-6 h-20 w-20 rounded-full bg-white/8" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest text-aqaar-dark/60">
                Start Your Journey
              </p>
              <h3
                className="mt-2 font-display text-3xl font-bold text-aqaar-dark"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Speak with Your
                <br />
                AI Property Advisor
              </h3>
              <p className="mt-4 text-sm leading-6 text-aqaar-dark/70">
                Our AI concierge qualifies your requirements, matches you with
                the right properties, and arranges private consultations — all
                in real time.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  id="invest-cta-btn"
                  href="#concierge"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-aqaar-dark px-6 py-3 text-sm font-bold text-white transition-all hover:bg-aqaar-panel"
                >
                  Start Concierge
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <button
                  id="invest-brochure-btn"
                  onClick={handleDownload}
                  disabled={downloadState !== "idle"}
                  className={`group inline-flex items-center gap-2 rounded-full border border-aqaar-dark/25 px-6 py-3 text-sm font-semibold text-aqaar-dark transition-all hover:bg-aqaar-dark/10 disabled:cursor-not-allowed ${
                    downloadState === "done" ? "border-green-600/30 bg-green-900/10" : ""
                  }`}
                >
                  {downloadState === "idle" && (
                    <>
                      <Download className="h-4 w-4 download-icon-animate" />
                      Download Guide
                    </>
                  )}
                  {downloadState === "loading" && (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Preparing...
                    </>
                  )}
                  {downloadState === "done" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600 animate-success-pop" />
                      Guide Sent!
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
