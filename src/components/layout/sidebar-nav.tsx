"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Search,
  Activity,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  Search,
  Activity,
} as const;

interface SidebarNavProps {
  collapsed?: boolean;
}

export function SidebarNav({ collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();

  // Group nav items by their group field
  const groups = NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    const group = item.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <nav className="flex flex-col gap-4 px-2">
      {Object.entries(groups).map(([groupName, items]) => (
        <div key={groupName}>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
              {groupName}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    collapsed ? "px-2.5 py-2 justify-center" : "px-3 py-2",
                    isActive
                      ? "bg-[#146DFA] text-white shadow-md shadow-[#146DFA]/25"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-white rounded-r-full" />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
