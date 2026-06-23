import Image from "next/image";
import {
  CheckCircle2,
  ArrowRight,
  Star,
  Waves,
  Utensils,
  Dumbbell,
  Car,
  Wifi,
  SunSnow,
} from "lucide-react";

const dusitFeatures = [
  "5-star Dusit Thani hotel services",
  "Dedicated concierge & valet",
  "Rooftop infinity pool & sky lounge",
  "Fine dining & wellness spa",
  "Smart home automation",
  "Panoramic Arabian Gulf views",
  "Flexible payment plan: 40/60",
];

const dusitAmenities = [
  { icon: Waves, label: "Infinity Pool" },
  { icon: Utensils, label: "Fine Dining" },
  { icon: Dumbbell, label: "Wellness Spa" },
  { icon: Car, label: "Valet Parking" },
  { icon: Wifi, label: "Smart Home" },
  { icon: SunSnow, label: "Sky Lounge" },
];

const mawjanFeatures = [
  "Waterfront living on Ajman Corniche",
  "Floor-to-ceiling glass facades",
  "Private beach access",
  "Lagoon-style swimming pool",
  "Jogging & cycling promenade",
  "High ROI: 8-10% yield potential",
  "Ready-to-move units available",
];

export function ProjectSpotlights() {
  return (
    <section className="bg-aqaar-deeper py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* ── Dusit Thani Spotlight ── */}
        <div className="mb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Image */}
            <div className="relative h-[500px] overflow-hidden rounded-2xl">
              <Image
                src="/images/dusit_thani.png"
                alt="Dusit Thani Residences Ajman"
                fill
                className="object-cover"
                sizes="700px"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-aqaar-deeper/60 via-transparent to-transparent" />

              {/* Rating badge */}
              <div className="absolute top-5 left-5 glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-aqaar-lime text-aqaar-lime" />
                  ))}
                </div>
                <p className="mt-1 text-xs font-bold text-white">5-Star Residences</p>
              </div>

              {/* Availability badge */}
              <div className="absolute bottom-5 left-5 right-5">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-aqaar-lime">Starting From</p>
                      <p className="mt-0.5 text-2xl font-bold text-white">AED 1.2M</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/50">Est. ROI</p>
                      <p className="mt-0.5 text-2xl font-bold text-aqaar-lime">9-11%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-8 bg-aqaar-lime" />
                <span className="text-xs font-bold uppercase tracking-widest text-aqaar-lime">
                  Flagship Development
                </span>
              </div>
              <h2
                className="font-display text-4xl font-bold text-white md:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Dusit Thani
                <br />
                <span className="italic">Residences</span>
              </h2>
              <p className="mt-5 leading-7 text-white/60">
                An unprecedented fusion of world-class hospitality and branded
                luxury living. Dusit Thani Residences at Ajman offers an
                unmatched lifestyle where every amenity is curated to perfection,
                steps from the shimmering Arabian Gulf.
              </p>

              {/* Amenities grid */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {dusitAmenities.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-aqaar-line bg-white/5 p-3"
                  >
                    <Icon className="h-5 w-5 text-aqaar-lime" />
                    <span className="text-center text-[11px] text-white/60">{label}</span>
                  </div>
                ))}
              </div>

              {/* Features list */}
              <ul className="mt-6 space-y-2.5">
                {dusitFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-aqaar-lime" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex gap-3">
                <a
                  id="dusit-enquire-btn"
                  href="#concierge"
                  className="group inline-flex items-center gap-2 rounded-full bg-aqaar-lime px-6 py-3 text-sm font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm"
                >
                  Enquire Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <button
                  id="dusit-brochure-btn"
                  className="inline-flex items-center gap-2 rounded-full border border-aqaar-line px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:border-aqaar-line-strong hover:text-white"
                >
                  Download Brochure
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="separator-lime mb-24" />

        {/* ── Mawjan Spotlight ── */}
        <div>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Content — left on this one */}
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-8 bg-aqaar-lime" />
                <span className="text-xs font-bold uppercase tracking-widest text-aqaar-lime">
                  Waterfront Living
                </span>
              </div>
              <h2
                className="font-display text-4xl font-bold text-white md:text-5xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Mawjan
                <br />
                <span className="italic">Waterfront Towers</span>
              </h2>
              <p className="mt-5 leading-7 text-white/60">
                Mawjan redefines coastal living in Ajman with an architectural
                masterpiece that mirrors the rhythmic waves of the Arabian Gulf.
                Every residence is designed to maximize natural light, ventilation,
                and sweeping sea views — the ultimate investment in lifestyle.
              </p>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { label: "Units", value: "480+" },
                  { label: "Floors", value: "32" },
                  { label: "Completion", value: "2026" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-aqaar-line bg-white/5 p-4">
                    <p className="text-2xl font-bold text-aqaar-lime">{value}</p>
                    <p className="mt-1 text-xs text-white/50">{label}</p>
                  </div>
                ))}
              </div>

              {/* Feature list */}
              <ul className="mt-6 space-y-2.5">
                {mawjanFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-sm text-white/70">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-aqaar-lime" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex gap-3">
                <a
                  id="mawjan-enquire-btn"
                  href="#concierge"
                  className="group inline-flex items-center gap-2 rounded-full bg-aqaar-lime px-6 py-3 text-sm font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm"
                >
                  Enquire Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <button
                  id="mawjan-brochure-btn"
                  className="inline-flex items-center gap-2 rounded-full border border-aqaar-line px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:border-aqaar-line-strong hover:text-white"
                >
                  Floor Plans
                </button>
              </div>
            </div>

            {/* Image — right on this one */}
            <div className="relative order-1 h-[500px] overflow-hidden rounded-2xl lg:order-2">
              <Image
                src="/images/mawjan.png"
                alt="Mawjan Waterfront Towers Ajman"
                fill
                className="object-cover"
                sizes="700px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-aqaar-deeper/60 via-transparent to-transparent" />

              {/* Waterfront badge */}
              <div className="absolute top-5 right-5 glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-aqaar-lime" />
                  <p className="text-xs font-bold text-white">Beachfront</p>
                </div>
              </div>

              {/* Price card */}
              <div className="absolute bottom-5 left-5 right-5">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-aqaar-lime">Starting From</p>
                      <p className="mt-0.5 text-2xl font-bold text-white">AED 680K</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/50">Est. ROI</p>
                      <p className="mt-0.5 text-2xl font-bold text-aqaar-lime">8-10%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
