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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SendToSlack } from "@/components/shared/send-to-slack";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface MeetingPrepDialogProps {
  companyName: string;
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingPrepDialog({
  companyName,
  meetingId,
  open,
  onOpenChange,
}: MeetingPrepDialogProps) {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/actions/meeting-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          currentMeetingId: meetingId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBrief(data.brief ?? "");
      setGenerated(true);
    } catch (error) {
      setBrief(`Error: ${(error as Error).message}`);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(brief);
    toast.success("Copied to clipboard");
  }

  // Auto-generate when dialog opens
  if (open && !generated && !loading) {
    generate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setBrief("");
          setGenerated(false);
        }
      }}
    >
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prepare for Next Call — {companyName}</DialogTitle>
          <DialogDescription>
            AI-generated prep brief based on all previous meetings with this company.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-6 w-36 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/50 p-4 max-h-96 overflow-y-auto">
              <ReactMarkdown>{brief}</ReactMarkdown>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <SendToSlack title={`Meeting Prep — ${companyName}`} body={brief} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
