"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraftEmailDialog } from "./draft-email-dialog";
import { ResummarizeDialog } from "./resummarize-dialog";
import { MeetingPrepDialog } from "./meeting-prep-dialog";
import { ChevronDown, Mail, FileText, Briefcase, Download, Printer } from "lucide-react";

interface ActionsMenuProps {
  meetingId: string;
  companyName: string | null;
  transcript: string | null;
  topic: string | null;
}

export function ActionsMenu({
  meetingId,
  companyName,
  transcript,
  topic,
}: ActionsMenuProps) {
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
