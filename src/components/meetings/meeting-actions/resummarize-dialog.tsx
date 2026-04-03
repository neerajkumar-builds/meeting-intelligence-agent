"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy } from "lucide-react";

interface ResummarizeDialogProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORMATS = [
  { value: "jake_sop", label: "Structured Call Notes (Client + FF Actions)" },
  { value: "executive_summary", label: "Leadership Brief (3-5 Sentences)" },
  { value: "bullet_points", label: "Quick Summary (Key Bullets)" },
  { value: "client_mom", label: "Client-Ready MOM (Shareable)" },
];

export function ResummarizeDialog({
  meetingId,
  open,
  onOpenChange,
}: ResummarizeDialogProps) {
  const [format, setFormat] = useState("jake_sop");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/actions/resummarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, format }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummary(data.summary ?? "");
      setGenerated(true);
    } catch (error) {
      setSummary(`Error: ${(error as Error).message}`);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(summary);
  }

  function reset() {
    setSummary("");
    setGenerated(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Summarize As...</DialogTitle>
          <DialogDescription>
            Re-summarize this meeting in a different format.
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-4">
            <Select
              value={format}
              onValueChange={(v) => setFormat(v ?? "jake_sop")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <Button onClick={generate}>Generate Summary</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <Button onClick={reset} variant="ghost" size="sm">
                Try Different Format
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
