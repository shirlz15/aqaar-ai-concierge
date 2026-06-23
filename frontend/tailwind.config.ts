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
        glow: "0 8px 64px rgba(214,228,28,0.08)",
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
      },
      animation: {
        "fade-up": "fade-up 0.6s ease forwards",
        "fade-in": "fade-in 0.5s ease forwards",
        shimmer: "shimmer 3s ease infinite",
        "count-up": "count-up 0.5s ease forwards",
        "pulse-lime": "pulse-lime 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
