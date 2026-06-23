"use client";

import { JourneyProvider } from "./journey-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <JourneyProvider>{children}</JourneyProvider>;
}
