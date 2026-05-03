"use client";

import { useState } from "react";
import { useCompanyIntelligence } from "@/lib/hooks/use-company-intelligence";
import { SidebarContent } from "./sidebar-content";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrainCircuit, PanelRightClose, PanelRight } from "lucide-react";

interface IntelligenceSidebarProps {
  companyName: string;
}

export function IntelligenceSidebar({ companyName }: IntelligenceSidebarProps) {
  const { data, isLoading, error } = useCompanyIntelligence(companyName);
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      {/* Desktop: collapsible sidebar */}
      <div className="hidden lg:flex shrink-0">
        {expanded ? (
          <aside className="w-[400px] border-l overflow-y-auto relative animate-in slide-in-from-right-4 duration-200">
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
              title="Collapse sidebar"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
            <SidebarContent data={data} isLoading={isLoading} error={error} />
          </aside>
        ) : (
          /* Floating edge tab — pinned to right edge of content area */
          <button
            onClick={() => setExpanded(true)}
            className="fixed right-0 top-1/3 z-30 flex items-center gap-1.5 pl-3 pr-2 py-2.5 rounded-l-lg bg-[#146DFA] text-white text-xs font-medium shadow-lg hover:pr-4 transition-all duration-200"
          >
            <BrainCircuit className="h-4 w-4" />
            <span>Intel</span>
            <PanelRight className="h-3 w-3 opacity-60" />
          </button>
        )}
      </div>

      {/* Mobile: floating button + bottom sheet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Sheet>
          <SheetTrigger
            render={
              <Button size="sm" className="gap-2 shadow-lg bg-[#146DFA] hover:bg-[#146DFA]/90 text-white" />
            }
          >
            <BrainCircuit className="h-4 w-4" />
            Company Intel
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto" showCloseButton={false}>
            <SidebarContent data={data} isLoading={isLoading} error={error} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
