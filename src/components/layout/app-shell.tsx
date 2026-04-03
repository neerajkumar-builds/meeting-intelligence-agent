"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar — dark background per brand guidelines */}
      <aside className="hidden lg:flex lg:w-56 lg:flex-col bg-[#0A0A0A] text-white">
        <Link href="/" className="flex h-14 items-center px-4 gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/favicon.svg"
            alt="FullFunnel"
            width={24}
            height={24}
            className="shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight text-white">
            Meeting Intel
          </span>
        </Link>
        <Separator className="bg-white/10" />
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <div className="border-t border-white/10 p-3 flex items-center justify-between">
          <Image
            src="/fullfunnel-logo-white.svg"
            alt="FullFunnel"
            width={100}
            height={16}
            className="opacity-50"
          />
          <span className="text-[10px] text-white/30 font-mono">v1.0.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b px-4 bg-background">
          <MobileNav />
          <Link href="/" className="hidden lg:flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/fullfunnel-logo.svg"
              alt="FullFunnel"
              width={120}
              height={20}
              className="dark:hidden"
            />
            <Image
              src="/fullfunnel-logo-white.svg"
              alt="FullFunnel"
              width={120}
              height={20}
              className="hidden dark:block"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
