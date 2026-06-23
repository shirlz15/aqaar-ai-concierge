"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
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
            ? "glass border-b border-aqaar-line py-3"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-baseline gap-0.5">
              <span
                className="font-display text-2xl font-bold tracking-tight text-white group-hover:text-white transition-colors"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Aqaar
              </span>
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-aqaar-lime inline-block mb-1 animate-pulse-lime" />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="animated-underline text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/admin"
              className="animated-underline text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="#concierge"
              className="group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full bg-aqaar-lime px-5 text-sm font-semibold text-aqaar-dark transition-all hover:bg-aqaar-lime-soft hover:shadow-lime-sm"
            >
              <span>Book Consultation</span>
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
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-20 glass md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-lg font-medium text-white/80 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/admin"
              className="block rounded-lg px-4 py-3 text-lg font-medium text-white/50 hover:bg-white/5 hover:text-white"
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
      )}
    </>
  );
}
