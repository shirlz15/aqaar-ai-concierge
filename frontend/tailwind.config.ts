import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aqaar: {
          dark: "#0B1015",
          panel: "#1B1F24",
          lime: "#D6E41C",
          soft: "#F6F7EF",
          line: "rgba(255,255,255,0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
      boxShadow: {
        concierge: "0 24px 80px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
