"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { SECTIONS, type SectionKey, type ScoringStageType } from "@/lib/constants";

interface SectionContextValue {
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
  stageTypes: ScoringStageType[];
  sectionLabel: string;
}

const SectionContext = createContext<SectionContextValue>({
  activeSection: "sales",
  setActiveSection: () => {},
  stageTypes: SECTIONS.sales.stageTypes,
  sectionLabel: SECTIONS.sales.label,
});

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSectionState] = useState<SectionKey>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("mi-section") as SectionKey) || "sales";
    }
    return "sales";
  });

  const setActiveSection = useCallback((section: SectionKey) => {
    setActiveSectionState(section);
    localStorage.setItem("mi-section", section);
  }, []);

  const config = SECTIONS[activeSection];

  return (
    <SectionContext value={{
      activeSection,
      setActiveSection,
      stageTypes: config.stageTypes,
      sectionLabel: config.label,
    }}>
      {children}
    </SectionContext>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
