"use client";

import { useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/search/chat-interface";

export default function AISearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? undefined;

  return (
    <div className="h-[calc(100vh-3.5rem-2rem)] md:h-[calc(100vh-3.5rem-3rem)]">
      <ChatInterface initialQuery={initialQuery} />
    </div>
  );
}
