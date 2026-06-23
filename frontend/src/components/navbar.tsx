"use client";

import { useState, useEffect } from "react";
import { Menu, X, Home, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { label: "Projects", href: "#projects" },
  { label: "Concierge", href: "#concierge" },
  { label: "Invest", href: "#invest" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass border-b border-aqaar-line py-3 shadow-luxury"
            : "py-5 bg-transparent"
        }`}
      >
        {/* Lime accent top bar on scroll */}
        {scrolled && (
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aqaar-lime/40 to-transparent" />
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="flex flex-col items-start gap-0">
              <div className="flex items-baseline gap-0.5">
                <span
                  className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-aqaar-lime transition-colors duration-300"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Aqaar
                </span>
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-aqaar-lime inline-block mb-1 animate-pulse-lime" />
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-aqaar-lime/60 -mt-0.5 hidden sm:block">
                Landscapes for Life
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {/* BUY pill */}
            <a
              href="#projects"
              className="group inline-flex items-center gap-1.5 rounded-full border border-aqaar-lime/30 bg-aqaar-lime/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-aqaar-lime transition-all hover:bg-aqaar-lime hover:text-aqaar-dark hover:border-aqaar-lime hover:shadow-lime-sm"
            >
              <Home className="h-3 w-3" />
              Buy
            </a>
            {/* RENT pill */}
            <a
              href="#projects"
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition-all hover:border-aqaar-lime/30 hover:bg-aqaar-lime/10 hover:text-aqaar-lime"
            >
              <Building2 className="h-3 w-3" />
              Rent
            </a>

            <div className="mx-2 h-4 w-px bg-aqaar-line" />

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="animated-underline px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/admin"
              className="animated-underline px-3 py-2 text-sm font-medium text-white/40 hover:text-white transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Right CTA + Trust */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Government trust badge */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Official Authority
              </span>
            </div>
            <a
              href="#concierge"
              className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full bg-aqaar-lime px-5 text-sm font-semibold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Book Consultation</span>
              {/* shimmer sweep */}
              <span className="absolute inset-0 -skew-x-12 translate-x-[-100%] bg-white/20 group-hover:translate-x-[200%] transition-transform duration-700" />
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-white/70 hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 pt-20 glass md:hidden transition-all duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          {/* BUY / RENT prominent pills */}
          <div className="flex gap-3 mb-4">
            <a
              href="#projects"
              onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-aqaar-lime/30 bg-aqaar-lime/10 py-3 text-sm font-bold text-aqaar-lime"
            >
              <Home className="h-4 w-4" />
              Buy
            </a>
            <a
              href="#projects"
              onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-white/70"
            >
              <Building2 className="h-4 w-4" />
              Rent
            </a>
          </div>

          {navLinks.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`block rounded-lg px-4 py-3 text-lg font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all ${
                mobileOpen ? "animate-fade-up" : ""
              }`}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/admin"
            className="block rounded-lg px-4 py-3 text-lg font-medium text-white/40 hover:bg-white/5 hover:text-white"
          >
            Admin
          </Link>
          <div className="mt-4">
            <a
              href="#concierge"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-full bg-aqaar-lime py-3 text-center text-sm font-semibold text-aqaar-dark"
            >
              Book Consultation
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
