"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraftEmailDialog } from "./draft-email-dialog";
import { ResummarizeDialog } from "./resummarize-dialog";
import { MeetingPrepDialog } from "./meeting-prep-dialog";
import { toast } from "sonner";
import { ChevronDown, Mail, FileText, Briefcase, Download, Printer, Copy, MessageSquare } from "lucide-react";

interface ActionsMenuProps {
  meetingId: string;
  companyName: string | null;
  transcript: string | null;
  topic: string | null;
  meetingSummary?: string | null;
  meetingScore?: unknown;
  repScore?: unknown;
  stageType?: string | null;
  overallScore?: number | null;
}

function buildMeetingBrief(props: ActionsMenuProps): string {
  const lines: string[] = [];
  lines.push(`*${props.topic ?? "Meeting"}*`);
  if (props.companyName) lines.push(`Company: ${props.companyName}`);
  if (props.overallScore) lines.push(`Overall Score: ${props.overallScore.toFixed(1)}/10`);
  lines.push("");

  if (props.meetingSummary) {
    lines.push("*Summary*");
    lines.push(props.meetingSummary);
    lines.push("");
  }

  const ms = props.meetingScore as Record<string, unknown> | null;
  if (ms) {
    if (ms.deal_sentiment) {
      lines.push(`*Deal Sentiment:* ${ms.deal_sentiment}`);
    }
    if (ms.relationship_health) {
      lines.push(`*Relationship Health:* ${ms.relationship_health}`);
    }
    if (ms.delivery_status) {
      lines.push(`*Delivery Status:* ${ms.delivery_status}`);
    }
    if (ms.next_actionables) {
      lines.push("");
      lines.push("*Next Steps*");
      lines.push(String(ms.next_actionables));
    }
    if (ms.reasoning_summary) {
      lines.push("");
      lines.push("*Reasoning*");
      lines.push(String(ms.reasoning_summary));
    }
    if (Array.isArray(ms.churn_risk_signals) && ms.churn_risk_signals.length > 0) {
      lines.push("");
      lines.push("*Churn Risk Signals*");
      for (const s of ms.churn_risk_signals) lines.push(`- ${s}`);
    }
    if (Array.isArray(ms.expansion_signals) && ms.expansion_signals.length > 0) {
      lines.push("");
      lines.push("*Expansion Signals*");
      for (const s of ms.expansion_signals) lines.push(`- ${s}`);
    }
  }

  const rs = props.repScore as Record<string, unknown> | null;
  if (rs) {
    if (rs.coaching_recommendations) {
      lines.push("");
      lines.push("*Coaching*");
      lines.push(String(rs.coaching_recommendations));
    }
  }

  return lines.join("\n");
}

export function ActionsMenu(props: ActionsMenuProps) {
  const { meetingId, companyName, transcript, topic } = props;
  const [emailOpen, setEmailOpen] = useState(false);
  const [resummarizeOpen, setResummarizeOpen] = useState(false);
  const [prepOpen, setPrepOpen] = useState(false);

  function downloadTranscript() {
    if (!transcript) return;
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(topic ?? "meeting").replace(/[^a-zA-Z0-9]/g, "_")}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyInsights() {
    const brief = buildMeetingBrief(props).replace(/\*/g, ""); // Strip markdown for clipboard
    navigator.clipboard.writeText(brief);
    toast.success("Meeting insights copied");
  }

  async function shareToSlack() {
    const brief = buildMeetingBrief(props);
    try {
      const res = await fetch("/api/notifications/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic ?? "Meeting Insights",
          body: brief,
          meetingUrl: `${window.location.origin}/meetings/${meetingId}`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to send");
        return;
      }
      toast.success("Shared to Slack");
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" className="gap-1" />
          }
        >
          Actions
          <ChevronDown className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setEmailOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Draft Follow-Up Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResummarizeOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Summarize As...
          </DropdownMenuItem>
          {companyName && (
            <DropdownMenuItem onClick={() => setPrepOpen(true)}>
              <Briefcase className="h-4 w-4 mr-2" />
              Prepare for Next Call
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyInsights}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Meeting Insights
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToSlack}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Share to Slack
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.open(`/meetings/${meetingId}/print`, "_blank")}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print / Export Report
          </DropdownMenuItem>
          {transcript && (
            <DropdownMenuItem onClick={downloadTranscript}>
              <Download className="h-4 w-4 mr-2" />
              Download Transcript
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DraftEmailDialog
        meetingId={meetingId}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
      <ResummarizeDialog
        meetingId={meetingId}
        open={resummarizeOpen}
        onOpenChange={setResummarizeOpen}
      />
      {companyName && (
        <MeetingPrepDialog
          companyName={companyName}
          meetingId={meetingId}
          open={prepOpen}
          onOpenChange={setPrepOpen}
        />
      )}
    </>
  );
}
