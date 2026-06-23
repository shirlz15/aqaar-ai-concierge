import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/toast-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aqaar AI Concierge — Luxury Real Estate in Ajman",
  description:
    "Discover premium properties in Ajman with Aqaar's AI-powered concierge. Expert advisory for Dusit Thani, Mawjan, and investment opportunities.",
  keywords: "Aqaar, Ajman real estate, luxury properties, Dusit Thani, Mawjan, UAE investment",
  openGraph: {
    title: "Aqaar AI Concierge — Luxury Real Estate in Ajman",
    description: "Premium property advisory powered by AI for discerning investors.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#0A0E14",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
