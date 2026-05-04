"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { SECTIONS, type SectionKey, type ScoringStageType } from "@/lib/constants";
import { supabase } from "@/lib/supabase/client";

interface UserRole {
  role: string;
  allowed_sections: string[];
  display_name: string | null;
}

interface SectionContextValue {
  activeSection: SectionKey;
  setActiveSection: (section: SectionKey) => void;
  stageTypes: ScoringStageType[];
  sectionLabel: string;
  allowedSections: SectionKey[];
  userRole: string | null;
  isAdmin: boolean;
  isRoleLoaded: boolean;
}

const SectionContext = createContext<SectionContextValue>({
  activeSection: "all",
  setActiveSection: () => {},
  stageTypes: SECTIONS.all.stageTypes,
  sectionLabel: SECTIONS.all.label,
  allowedSections: Object.keys(SECTIONS) as SectionKey[],
  userRole: null,
  isAdmin: false,
  isRoleLoaded: false,
});

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSectionState] = useState<SectionKey>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("mi-section") as SectionKey) || "all";
    }
    return "all";
  });

  const [allowedSections, setAllowedSections] = useState<SectionKey[]>(
    Object.keys(SECTIONS) as SectionKey[]
  );
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

  useEffect(() => {
    async function loadUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role, allowed_sections, display_name, is_active")
        .eq("email", user.email)
        .single();

      if (data) {
        const role = data as UserRole & { is_active?: boolean };
        if (role.is_active === false) {
          await supabase.auth.signOut();
          window.location.href = "/login?error=deactivated";
          return;
        }
        setUserRole(role.role);
        setIsRoleLoaded(true);
        const sections = role.allowed_sections.filter(
          (s): s is SectionKey => s in SECTIONS
        );
        if (sections.length > 0) {
          setAllowedSections(sections);
          const stored = localStorage.getItem("mi-section") as SectionKey;
          if (!stored || !sections.includes(stored)) {
            setActiveSectionState(sections[0]);
            localStorage.setItem("mi-section", sections[0]);
          }
        }
      } else {
        setIsRoleLoaded(true);
      }
    }
    loadUserRole();
  }, []);

  const setActiveSection = useCallback((section: SectionKey) => {
    if (allowedSections.includes(section)) {
      setActiveSectionState(section);
      localStorage.setItem("mi-section", section);
    }
  }, [allowedSections]);

  const config = SECTIONS[activeSection];
  const isAdmin = userRole === "leadership" || userRole === "admin";

  return (
    <SectionContext value={{
      activeSection,
      setActiveSection,
      stageTypes: config.stageTypes,
      sectionLabel: config.label,
      allowedSections,
      userRole,
      isAdmin,
      isRoleLoaded,
    }}>
      {children}
    </SectionContext>
  );
}

export function useSection() {
  return useContext(SectionContext);
}
