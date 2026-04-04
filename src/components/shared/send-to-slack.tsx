"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, MessageSquare, AlertCircle } from "lucide-react";

interface SendToSlackProps {
  title: string;
  body: string;
  meetingUrl?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

export function SendToSlack({ title, body, meetingUrl }: SendToSlackProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/notifications/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, meetingUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to send");
        setStatus("error");
        return;
      }

      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSend}
        disabled={status === "sending" || status === "sent"}
        className="gap-1.5 text-xs"
      >
        {status === "sending" && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === "sent" && <Check className="h-3 w-3 text-emerald-500" />}
        {status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
        {status === "idle" && <MessageSquare className="h-3 w-3" />}
        {status === "sent" ? "Sent!" : status === "sending" ? "Sending..." : "Send to Slack"}
      </Button>
      {status === "error" && (
        <span className="text-[10px] text-red-500">{errorMsg}</span>
      )}
    </div>
  );
}
