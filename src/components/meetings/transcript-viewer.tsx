"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendToSlack } from "@/components/shared/send-to-slack";
import { ChevronDown, ChevronRight, Search, Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface TranscriptViewerProps {
  transcript: string | null;
  meetingTopic?: string;
}

export function TranscriptViewer({ transcript, meetingTopic }: TranscriptViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  if (!transcript) {
    return (
      <p className="text-sm text-muted-foreground">No transcript available.</p>
    );
  }

  function handleCopy() {
    navigator.clipboard.writeText(transcript!);
    toast.success("Transcript copied to clipboard");
  }

  function handleDownload() {
    const filename = (meetingTopic ?? "transcript").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_") + ".txt";
    const blob = new Blob([transcript!], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Transcript ({Math.round(transcript.length / 5)} words approx.)
        </Button>
        {expanded && (
          <>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy transcript"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Download as text file"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
              <SendToSlack
                title={`Transcript - ${meetingTopic ?? "Meeting"}`}
                body={transcript}
              />
            </div>
          </>
        )}
      </div>
      {expanded && (
        <div className="rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
            <HighlightedText text={transcript} searchTerm={searchTerm} />
          </pre>
        </div>
      )}
    </div>
  );
}

function HighlightedText({
  text,
  searchTerm,
}: {
  text: string;
  searchTerm: string;
}) {
  const segments = useMemo(() => {
    if (!searchTerm) return [{ text, highlight: false }];

    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);

    return parts.map((part) => ({
      text: part,
      highlight: part.toLowerCase() === searchTerm.toLowerCase(),
    }));
  }, [text, searchTerm]);

  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}
