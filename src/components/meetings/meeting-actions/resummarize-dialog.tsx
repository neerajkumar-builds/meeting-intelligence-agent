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
import { SendToSlack } from "@/components/shared/send-to-slack";
import { Copy, RotateCcw, FileText, Sparkles } from "lucide-react";

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
  const [copied, setCopied] = useState(false);

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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setSummary("");
    setGenerated(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Summarize As...</DialogTitle>
              <DialogDescription>
                Re-summarize this meeting in a different format
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!generated ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Format</label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v ?? "jake_sop")}
                >
                  <SelectTrigger className="w-full">
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
              </div>

              {loading ? (
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    Generating summary...
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <Button onClick={generate} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Summary
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {FORMATS.find((f) => f.value === format)?.label ?? "Summary"}
                </label>
              </div>
              <div className="p-4 prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {generated && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </Button>
            <SendToSlack title={FORMATS.find((f) => f.value === format)?.label ?? "Meeting Summary"} body={summary} />
            <div className="flex-1" />
            <Button onClick={reset} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Try Different Format
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
