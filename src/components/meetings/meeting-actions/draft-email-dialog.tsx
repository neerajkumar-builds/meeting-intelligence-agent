"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Copy, ExternalLink, RotateCcw, Mail, Sparkles } from "lucide-react";

interface DraftEmailDialogProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATES = [
  { value: "client_followup", label: "Client Follow-Up Email" },
  { value: "internal_recap", label: "Internal Team Recap" },
  { value: "executive_briefing", label: "CEO / Leadership Brief" },
];

export function DraftEmailDialog({
  meetingId,
  open,
  onOpenChange,
}: DraftEmailDialogProps) {
  const [template, setTemplate] = useState("client_followup");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/actions/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, template }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubject(data.subject ?? "");
      setBody(data.body ?? "");
      setGenerated(true);
    } catch (error) {
      setBody(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function openInGmail() {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  }

  function reset() {
    setSubject("");
    setBody("");
    setGenerated(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Draft Follow-Up Email</DialogTitle>
              <DialogDescription>
                AI-generated email from meeting context
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!generated ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Template</label>
                <Select
                  value={template}
                  onValueChange={(v) => setTemplate(v ?? "client_followup")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    Generating email draft...
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <Button onClick={generate} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Draft
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
                </div>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-medium bg-transparent focus:outline-none"
                />
              </div>

              {/* Body */}
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body</label>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-3 text-sm leading-relaxed bg-transparent focus:outline-none resize-none min-h-[350px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {generated && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button onClick={openInGmail} variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Gmail
            </Button>
            <SendToSlack title={subject} body={body} />
            <div className="flex-1" />
            <Button onClick={reset} variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
