"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, MapPin, Sparkles, TrendingUp } from "lucide-react";

const stats = [
  { label: "Active Projects", value: 12, suffix: "+" },
  { label: "Sqft Delivered", value: 4.2, suffix: "M+" },
  { label: "Avg ROI", value: 8.5, suffix: "%" },
  { label: "Happy Investors", value: 3200, suffix: "+" },
];

function AnimatedCounter({
  value,
  suffix,
}: {
  value: number;
  suffix: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplay(value);
              clearInterval(timer);
            } else {
              setDisplay(parseFloat(current.toFixed(1)));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {value >= 1000
        ? display.toLocaleString("en")
        : display.toFixed(value % 1 !== 0 ? 1 : 0)}
      {suffix}
    </span>
  );
}

export function HeroSection() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-aqaar-deeper">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero_tower.png"
          alt="Luxury property in Ajman"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-aqaar-deeper via-aqaar-deeper/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-aqaar-deeper via-transparent to-transparent" />
      </div>

      {/* Ambient glow */}
      <div
        className="hero-blob"
        style={{ left: "60%", top: "40%", transform: "translate(-50%, -50%)" }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-28 pb-16">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border border-aqaar-lime/30 bg-aqaar-lime/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-aqaar-lime transition-all duration-700 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Luxury Real Estate Advisory
          </div>

          {/* Headline */}
          <h1
            className={`font-display text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl transition-all duration-700 delay-100 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Live Where
            <br />
            <span className="italic text-aqaar-lime">Excellence</span>
            <br />
            Meets the Sea
          </h1>

          <p
            className={`mt-6 max-w-xl text-lg leading-8 text-white/65 transition-all duration-700 delay-200 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Aqaar curates Ajman's most coveted properties — from the iconic
            Dusit Thani Residences to the waterfront Mawjan towers. Guided by
            AI. Crafted for discerning investors.
          </p>

          {/* Location badge */}
          <div
            className={`mt-4 inline-flex items-center gap-2 text-sm text-white/50 transition-all duration-700 delay-300 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <MapPin className="h-4 w-4 text-aqaar-lime" />
            Ajman, United Arab Emirates
          </div>

          {/* CTAs */}
          <div
            className={`mt-10 flex flex-col gap-3 sm:flex-row transition-all duration-700 delay-400 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <a
              id="hero-explore-btn"
              href="#concierge"
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-aqaar-lime px-8 text-sm font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime hover:gap-4"
            >
              <Sparkles className="h-4 w-4" />
              Start AI Concierge
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              id="hero-projects-btn"
              href="#projects"
              className="inline-flex h-14 items-center gap-2 rounded-full border border-aqaar-line bg-white/5 px-8 text-sm font-semibold text-white transition-all hover:border-aqaar-line-strong hover:bg-white/10"
            >
              View Projects
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div
          className={`mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4 transition-all duration-700 delay-500 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-aqaar-lime" />
                <span className="text-xs uppercase tracking-widest text-white/40">
                  {stat.label}
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold text-white">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom separator */}
      <div className="separator-lime absolute bottom-0 left-0 right-0" />
    </section>
  );
}
