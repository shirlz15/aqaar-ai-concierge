"use client";

import Link from "next/link";
import { MapPin, Mail, Phone, ExternalLink, Shield, BadgeCheck, Instagram, Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  Properties: [
    { label: "Dusit Thani", href: "#projects" },
    { label: "Mawjan Waterfront", href: "#projects" },
    { label: "Ajman One", href: "#projects" },
    { label: "Al Zorah", href: "#projects" },
  ],
  Invest: [
    { label: "Why Ajman", href: "#invest" },
    { label: "ROI Calculator", href: "#concierge" },
    { label: "Payment Plans", href: "#concierge" },
    { label: "Golden Visa", href: "/api/downloads/market-report" },
  ],
  Company: [
    { label: "About Aqaar", href: "https://aqaar.com" },
    { label: "News & Media", href: "https://aqaar.com" },
    { label: "Careers", href: "https://aqaar.com" },
    { label: "Contact", href: "#concierge" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#concierge" },
    { label: "Terms of Use", href: "#concierge" },
    { label: "Data Protection", href: "#concierge" },
  ],
};

const trustBadges = [
  { icon: Shield, label: "Government Entity" },
  { icon: BadgeCheck, label: "RERA Registered" },
  { icon: BadgeCheck, label: "Escrow Protected" },
  { icon: BadgeCheck, label: "ISO Certified" },
];

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Twitter, label: "X / Twitter", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-aqaar-line bg-aqaar-deeper">
      {/* Trust strip */}
      <div className="trust-strip">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-aqaar-lime" />
                <span className="text-xs font-semibold text-white/60">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex flex-col items-start gap-0">
              <div className="flex items-baseline gap-0.5">
                <span
                  className="font-display text-2xl font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Aqaar
                </span>
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-aqaar-lime inline-block mb-1" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-aqaar-lime/60 mt-0.5">
                Landscapes for Life
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/50">
              Ajman's premier real estate authority. Curating luxury
              properties and investment opportunities since 1990.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-white/40">
                <MapPin className="h-3.5 w-3.5 text-aqaar-lime" />
                1st Floor, Grand Mall, Sheikh Khalifa Bin Zayed St, Ajman
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

            {/* Social links */}
            <div className="mt-6 flex gap-2">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-aqaar-line bg-white/5 text-white/50 transition-all hover:border-aqaar-lime/30 hover:bg-aqaar-lime/10 hover:text-aqaar-lime"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
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
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="animated-underline text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter subscribe */}
        <div className="mt-14 rounded-2xl border border-aqaar-line bg-aqaar-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-white">Stay Updated</p>
              <p className="mt-1 text-xs text-white/50">
                Receive the latest property launches, market insights, and exclusive offers.
              </p>
            </div>
            <form className="flex gap-2 min-w-0 md:min-w-[320px]" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 rounded-full border border-aqaar-line bg-aqaar-panel px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-aqaar-lime transition-colors"
              />
              <button
                type="submit"
                className="rounded-full bg-aqaar-lime px-5 py-2.5 text-xs font-bold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-aqaar-line pt-8 md:flex-row">
          <p className="text-xs text-white/30">
            © 2026 Aqaar — Ajman Real Estate Authority. All rights reserved.
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
