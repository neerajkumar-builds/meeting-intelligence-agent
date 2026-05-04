"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECTIONS, SECTION_NAV_ITEMS, type SectionKey } from "@/lib/constants";
import { useSection } from "@/lib/section-context";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Search,
  Activity,
  TrendingUp,
  HeartHandshake,
  Lock,
  BarChart3,
  ChevronRight,
  Settings,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Search,
  Activity,
  TrendingUp,
  HeartHandshake,
  Lock,
  BarChart3,
  Settings,
} as const;

const TOOL_ITEMS = [
  { label: "System Health", href: "/health", icon: "Activity" as const },
];

const ADMIN_ITEM = { label: "Admin", href: "/admin", icon: "Settings" as const };

interface SidebarNavProps {
  collapsed?: boolean;
}

export function SidebarNav({ collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();
  const { activeSection, setActiveSection, allowedSections, isAdmin } = useSection();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {(Object.entries(SECTIONS) as [SectionKey, (typeof SECTIONS)[SectionKey]][])
        .filter(([key]) => allowedSections.includes(key))
        .map(([key, section]) => {
          const SectionIcon = ICON_MAP[section.icon];
          const isActive = key === activeSection;

          return (
            <div key={key}>
              <button
                onClick={() => setActiveSection(key)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-lg text-xs font-semibold transition-all duration-200",
                  collapsed ? "px-2.5 py-2.5 justify-center relative" : "px-3 py-2",
                  isActive
                    ? collapsed
                      ? "text-white bg-[#146DFA]/20 border border-[#146DFA]/30"
                      : "text-white bg-white/8"
                    : "text-white/40 hover:text-white/60 hover:bg-white/5"
                )}
                title={collapsed ? section.label : undefined}
              >
                <SectionIcon className={cn("shrink-0", collapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left uppercase tracking-wider">
                      {section.shortLabel}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        isActive && "rotate-90"
                      )}
                    />
                  </>
                )}
                {isActive && collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#146DFA] rounded-r-full" />
                )}
              </button>

              {isActive && !collapsed && (
                <div className="flex flex-col gap-0.5 mt-0.5 ml-2 pl-3 border-l border-white/10">
                  {SECTION_NAV_ITEMS.map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    const isPageActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-200 px-2.5 py-1.5",
                          isPageActive
                            ? "bg-[#146DFA] text-white shadow-md shadow-[#146DFA]/25"
                            : "text-white/60 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
      )}

      {/* Tools section */}
      <div className="mt-3 pt-3 border-t border-white/10">
        {!collapsed && (
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Tools
          </p>
        )}
        {[...TOOL_ITEMS, ...(isAdmin ? [ADMIN_ITEM] : [])].map((item) => {
          const Icon = ICON_MAP[item.icon as keyof typeof ICON_MAP];
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed ? "px-2.5 py-2 justify-center" : "px-3 py-2",
                isActive
                  ? "bg-[#146DFA] text-white shadow-md shadow-[#146DFA]/25"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
