"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SyncIndicator } from "@/components/shared/sync-indicator";
import { NotificationsBell } from "@/components/shared/notifications-bell";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Cmd+K / Ctrl+K shortcut to jump to Ask Blarney
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar - dark background per brand guidelines */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-[#0A0A0A] text-white transition-all duration-200 ${
          collapsed ? "lg:w-14" : "lg:w-56"
        }`}
      >
        <Link href="/" className="flex h-14 items-center px-4 gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/favicon.svg"
            alt="FullFunnel"
            width={24}
            height={24}
            className="shrink-0"
          />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-white">
              Meeting Intel
            </span>
          )}
        </Link>
        <Separator className="bg-white/10" />
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} />
        </div>

        {/* Collapse toggle + footer */}
        <div className="border-t border-white/10 p-2 flex items-center justify-between">
          {!collapsed && (
            <Image
              src="/fullfunnel-logo-white.svg"
              alt="FullFunnel"
              width={100}
              height={16}
              className="opacity-50"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b px-4 bg-background">
          <MobileNav />
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <SyncIndicator />
            <NotificationsBell />
            {/* Cmd+K hint */}
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
              <span className="text-xs">&#8984;</span>K
            </kbd>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
