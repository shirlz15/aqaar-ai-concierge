import Link from "next/link";
import { MapPin, Mail, Phone, ExternalLink } from "lucide-react";

const footerLinks = {
  Properties: ["Dusit Thani", "Mawjan Waterfront", "Ajman One", "Al Zorah"],
  Invest: ["Why Ajman", "ROI Calculator", "Payment Plans", "Golden Visa"],
  Company: ["About Aqaar", "News & Media", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Use", "Data Protection"],
};

export function Footer() {
  return (
    <footer className="border-t border-aqaar-line bg-aqaar-deeper">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-baseline gap-0.5">
              <span
                className="font-display text-2xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Aqaar
              </span>
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-aqaar-lime inline-block mb-1" />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/50">
              Ajman's premier real estate authority. Curating luxury
              properties and investment opportunities since 1990.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <MapPin className="h-3.5 w-3.5 text-aqaar-lime" />
                Ajman, United Arab Emirates
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Phone className="h-3.5 w-3.5 text-aqaar-lime" />
                +971 6 xxx xxxx
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <Mail className="h-3.5 w-3.5 text-aqaar-lime" />
                concierge@aqaar.com
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
                {category}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="animated-underline text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-aqaar-line pt-8 md:flex-row">
          <p className="text-xs text-white/30">
            © 2025 Aqaar — Ajman Real Estate Authority. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Admin Portal
              <ExternalLink className="h-3 w-3" />
            </Link>
            <a
              href="https://aqaar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-aqaar-lime transition-colors"
            >
              aqaar.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
