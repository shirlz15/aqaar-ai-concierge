import Image from "next/image";
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
} from "lucide-react";
import type { CsvRow } from "@/lib/server/csv";

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
  // Alternate fallbacks by index hash
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

export function PropertyCard({
  project,
  priority = false,
  featured = false,
  index = 0,
}: PropertyCardProps) {
  const imgSrc = getProjectImage(project.project_name as string);
  const roi = (project.roi_yield as string) || "7-9%";
  const investScore = getInvestmentScore(roi);
  const priceRange = (project.price_range as string) || "AED 600K - 3.5M";

  const amenities = [
    "pool",
    "gym",
    "parking",
    "restaurant",
    "security",
  ].slice(0, 4);

  return (
    <article
      id={`property-card-${index}`}
      className={`property-card group relative overflow-hidden rounded-2xl border border-aqaar-line bg-aqaar-card ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${featured ? "h-72" : "h-52"}`}>
        <Image
          src={imgSrc}
          alt={project.project_name as string}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes={featured ? "800px" : "400px"}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-card-gradient" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="glass rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-aqaar-lime">
            {project.project_type as string}
          </span>
        </div>

        {/* AI match badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1.5 rounded-full bg-aqaar-lime px-3 py-1">
            <Award className="h-3 w-3 text-aqaar-dark" />
            <span className="text-[10px] font-bold text-aqaar-dark">
              AI Pick
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-aqaar-lime" />
          <span className="text-xs text-white/80">
            {project.location as string}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {project.project_name as string}
            </h3>
            <p className="mt-0.5 text-sm text-aqaar-lime">{priceRange}</p>
          </div>
          {/* Investment score ring */}
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="#D6E41C"
                strokeWidth="2.5"
                strokeDasharray={`${investScore} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[11px] font-bold text-aqaar-lime">{investScore}</span>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
          {project.description as string}
        </p>

        {/* Amenity pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon = amenityIcons[amenity] || Shield;
            return (
              <span
                key={amenity}
                className="flex items-center gap-1 rounded-full border border-aqaar-line bg-white/5 px-2.5 py-1 text-[10px] font-medium capitalize text-white/60"
              >
                <Icon className="h-2.5 w-2.5 text-aqaar-lime" />
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
            className="group/btn inline-flex items-center gap-1.5 rounded-full border border-aqaar-lime/30 bg-aqaar-lime/10 px-4 py-2 text-xs font-semibold text-aqaar-lime transition-all hover:bg-aqaar-lime hover:text-aqaar-dark"
          >
            Enquire
            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
