"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Search,
  Activity,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Search,
  Activity,
} as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[#146DFA] text-white shadow-md shadow-[#146DFA]/25"
                : "text-white/60 hover:bg-white/8 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
