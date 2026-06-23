"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CsvRow } from "@/lib/server/csv";

type JourneyMode = "Buy" | "Rent" | "Invest";

type JourneyContextType = {
  mode: JourneyMode;
  setMode: (mode: JourneyMode) => void;
  enquiryProperty: CsvRow | null;
  setEnquiryProperty: (prop: CsvRow | null) => void;
  isConsultationOpen: boolean;
  setConsultationOpen: (open: boolean) => void;
};

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<JourneyMode>("Buy");
  const [enquiryProperty, setEnquiryProperty] = useState<CsvRow | null>(null);
  const [isConsultationOpen, setConsultationOpen] = useState(false);

  return (
    <JourneyContext.Provider
      value={{
        mode,
        setMode,
        enquiryProperty,
        setEnquiryProperty,
        isConsultationOpen,
        setConsultationOpen,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error("useJourney must be used within JourneyProvider");
  }
  return context;
}
