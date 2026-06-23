"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  TrendingUp,
  Award,
  Waves,
  UtensilsCrossed,
  Dumbbell,
  Car,
  Shield,
  ArrowRight,
  Home,
  Building2,
  Bed,
  Bath,
} from "lucide-react";
import type { CsvRow } from "@/lib/server/csv";
import { useJourney } from "@/lib/client/journey-context";

type PropertyCardProps = {
  project: CsvRow;
  priority?: boolean;
  featured?: boolean;
  index?: number;
};

const amenityIcons: Record<string, typeof Waves> = {
  pool: Waves,
  gym: Dumbbell,
  parking: Car,
  restaurant: UtensilsCrossed,
  security: Shield,
};

const projectImages: Record<string, string> = {
  "Dusit Thani": "/images/dusit_thani.png",
  "Mawjan": "/images/mawjan.png",
};

function getProjectImage(name: string): string {
  for (const [key, img] of Object.entries(projectImages)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return img;
  }
  const images = [
    "/images/hero_tower.png",
    "/images/ajman_skyline.png",
    "/images/luxury_interior.png",
    "/images/mawjan.png",
  ];
  const hash =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    images.length;
  return images[hash];
}

function getInvestmentScore(roi: string): number {
  const num = parseFloat(roi?.replace(/[^0-9.]/g, "") || "7");
  if (num >= 10) return 95;
  if (num >= 8) return 85;
  if (num >= 6) return 72;
  return 60;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#22c55e";
  if (score >= 80) return "#D6E41C";
  if (score >= 70) return "#f59e0b";
  return "#6b7280";
}

function InvestmentRing({ score }: { score: number }) {
  const ref = useRef<SVGCircleElement>(null);
  const [animated, setAnimated] = useState(false);
  const color = getScoreColor(score);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          ref={ref}
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={animated ? `${score} 100` : "0 100"}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.23,1,0.32,1) 0.3s" }}
        />
      </svg>
      <span className="text-[11px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export function PropertyCard({
  project,
  priority = false,
  featured = false,
  index = 0,
}: PropertyCardProps) {
  const [hovered, setHovered] = useState(false);
  const { setEnquiryProperty } = useJourney();
  const imgSrc = getProjectImage(project.project_name as string);
  const roi = (project.roi_yield as string) || "7-9%";
  const investScore = getInvestmentScore(roi);
  const priceRange = (project.price_range as string) || "AED 600K - 3.5M";
  const projectType = (project.project_type as string) || "Buy";
  const isBuy = !projectType.toLowerCase().includes("rent");

  const amenities = ["pool", "gym", "parking", "restaurant", "security"].slice(0, 4);

  return (
    <article
      id={`property-card-${index}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`property-card group relative overflow-hidden rounded-2xl border border-aqaar-line bg-aqaar-card ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      {/* Image */}
      <div className={`card-image-container relative overflow-hidden ${featured ? "h-72" : "h-52"}`}>
        <Image
          src={imgSrc}
          alt={project.project_name as string}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-107"
          sizes={featured ? "800px" : "400px"}
          style={{ transform: hovered ? "scale(1.07)" : "scale(1)", transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1)" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-card-gradient" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
              isBuy
                ? "bg-aqaar-lime/90 text-aqaar-dark"
                : "bg-aqaar-trust/90 text-white"
            }`}
          >
            {isBuy ? <Home className="h-2.5 w-2.5" /> : <Building2 className="h-2.5 w-2.5" />}
            {isBuy ? "Buy" : "Rent"}
          </span>
        </div>

        {/* AI match badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 rounded-full glass px-3 py-1 border border-aqaar-lime/30">
            <Award className="h-3 w-3 text-aqaar-lime" />
            <span className="text-[10px] font-bold text-aqaar-lime">
              AI Pick
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-aqaar-lime" />
          <span className="text-xs text-white/90 font-medium drop-shadow-sm">
            {project.location as string}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight truncate">
              {project.project_name as string}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-aqaar-lime">{priceRange}</p>
          </div>
          <InvestmentRing score={investScore} />
        </div>

        {/* Bed/Bath if available */}
        <div className="mt-2.5 flex items-center gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Bed className="h-3 w-3 text-aqaar-lime/70" />
            1-3 BR
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3 text-aqaar-lime/70" />
            2+ Bath
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">
          {project.description as string}
        </p>

        {/* Amenity pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon = amenityIcons[amenity] || Shield;
            return (
              <span
                key={amenity}
                className="flex items-center gap-1 rounded-full border border-aqaar-line bg-white/5 px-2.5 py-1 text-[10px] font-medium capitalize text-white/60 transition-all hover:border-aqaar-lime/30 hover:text-aqaar-lime hover:bg-aqaar-lime/5"
              >
                <Icon className="h-2.5 w-2.5 text-aqaar-lime/70" />
                {amenity}
              </span>
            );
          })}
        </div>

        {/* ROI row */}
        <div className="mt-4 flex items-center justify-between border-t border-aqaar-line pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-aqaar-lime" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40">
                Est. ROI
              </p>
              <p className="text-sm font-bold text-aqaar-lime">{roi}</p>
            </div>
          </div>
          <button
            id={`enquire-btn-${index}`}
            onClick={() => setEnquiryProperty(project)}
            className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-aqaar-lime/30 bg-aqaar-lime/10 px-4 py-2 text-xs font-semibold text-aqaar-lime transition-all hover:bg-aqaar-lime hover:text-aqaar-dark hover:border-aqaar-lime hover:shadow-lime-sm hover:gap-2"
          >
            Enquire
            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
            <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] bg-white/20 group-hover/btn:translate-x-[200%] transition-transform duration-500" />
          </button>
        </div>
      </div>
    </article>
  );
}
