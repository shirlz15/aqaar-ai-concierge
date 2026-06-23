import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aqaar: {
          dark: "#0A0E14",
          deeper: "#06090D",
          darker: "#040608",
          panel: "#111519",
          card: "#161B21",
          lime: "#D6E41C",
          "lime-soft": "#E8F53A",
          "lime-dim": "rgba(214,228,28,0.12)",
          soft: "#F6F7EF",
          line: "rgba(255,255,255,0.10)",
          "line-strong": "rgba(255,255,255,0.18)",
          muted: "rgba(255,255,255,0.55)",
          faint: "rgba(255,255,255,0.35)",
          gold: "#C9A84C",
          trust: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "Arial", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        concierge: "0 24px 80px rgba(0,0,0,0.55)",
        card: "0 4px 32px rgba(0,0,0,0.4)",
        lime: "0 0 40px rgba(214,228,28,0.15)",
        "lime-sm": "0 0 20px rgba(214,228,28,0.1)",
        "lime-md": "0 0 32px rgba(214,228,28,0.2)",
        "lime-lg": "0 0 60px rgba(214,228,28,0.25)",
        glow: "0 8px 64px rgba(214,228,28,0.08)",
        luxury: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
        "inner-lime": "inset 0 0 20px rgba(214,228,28,0.05)",
        "trust": "0 0 20px rgba(59,130,246,0.15)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, rgba(10,14,20,0.95) 0%, rgba(10,14,20,0.5) 50%, rgba(10,14,20,0.85) 100%)",
        "card-gradient":
          "linear-gradient(180deg, transparent 40%, rgba(10,14,20,0.95) 100%)",
        "lime-gradient":
          "linear-gradient(135deg, #D6E41C 0%, #A8B515 100%)",
        "panel-gradient":
          "linear-gradient(180deg, #111519 0%, #0A0E14 100%)",
        "section-gradient":
          "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(214,228,28,0.06) 0%, transparent 70%)",
        "buy-gradient":
          "linear-gradient(135deg, rgba(214,228,28,0.12) 0%, rgba(214,228,28,0.04) 100%)",
        "rent-gradient":
          "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)",
        "trust-gradient":
          "linear-gradient(90deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.03) 100%)",
        "cta-gradient":
          "linear-gradient(135deg, #D6E41C 0%, #B8C918 100%)",
        "footer-gradient":
          "linear-gradient(180deg, rgba(214,228,28,0.03) 0%, transparent 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-lime": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(214,228,28,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(214,228,28,0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) rotate(0.5deg)" },
          "66%": { transform: "translateY(-4px) rotate(-0.5deg)" },
        },
        "border-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "msg-in": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "success-pop": {
          "0%": { opacity: "0", transform: "scale(0.7)" },
          "60%": { transform: "scale(1.1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "roi-draw": {
          "0%": { strokeDasharray: "0 100" },
          "100%": { strokeDasharray: "var(--roi) 100" },
        },
        "ping-lime": {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease forwards",
        "fade-in": "fade-in 0.5s ease forwards",
        shimmer: "shimmer 3s ease infinite",
        "count-up": "count-up 0.5s ease forwards",
        "pulse-lime": "pulse-lime 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "border-shimmer": "border-shimmer 4s ease infinite",
        "slide-in-left": "slide-in-left 0.8s cubic-bezier(0.23,1,0.32,1) forwards",
        "slide-in-right": "slide-in-right 0.8s cubic-bezier(0.23,1,0.32,1) forwards",
        "msg-in": "msg-in 0.28s cubic-bezier(0.23,1,0.32,1) forwards",
        "success-pop": "success-pop 0.4s ease forwards",
        "ping-lime": "ping-lime 1s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
