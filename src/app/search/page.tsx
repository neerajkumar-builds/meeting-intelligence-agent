"use client";

import { useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/search/chat-interface";
import { useSection } from "@/lib/section-context";
import { SECTION_PROMPTS } from "@/lib/constants";

export default function AISearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? undefined;
  const { activeSection, sectionLabel } = useSection();
  const prompts = SECTION_PROMPTS[activeSection];

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] md:h-[calc(100vh-3.5rem-3rem)]">
      <ChatInterface
        initialQuery={initialQuery}
        suggestedPrompts={prompts}
        sectionLabel={sectionLabel}
      />
    </div>
  );
}
