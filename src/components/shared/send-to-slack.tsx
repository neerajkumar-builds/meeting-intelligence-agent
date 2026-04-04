"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Loader2, MessageSquare, AlertCircle } from "lucide-react";

interface SendToSlackProps {
  title: string;
  body: string;
  meetingUrl?: string;
}

type Status = "idle" | "sending" | "sent" | "error";

interface SlackChannel {
  id: string;
  name: string;
}

const LAST_CHANNEL_KEY = "slack-last-channel";

export function SendToSlack({ title, body, meetingUrl }: SendToSlackProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    async function fetchChannels() {
      try {
        const res = await fetch("/api/slack/channels");
        const data = await res.json();
        if (data.channels?.length > 0) {
          setChannels(data.channels);
          const saved = localStorage.getItem(LAST_CHANNEL_KEY);
          const validSaved = data.channels.find((c: SlackChannel) => c.id === saved);
          setSelectedChannel(validSaved ? saved! : data.channels[0].id);
        }
      } catch {
        // Channels unavailable — will fall back to webhook
      } finally {
        setLoadingChannels(false);
      }
    }
    fetchChannels();
  }, []);

  async function handleSend() {
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/notifications/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          meetingUrl,
          channelId: selectedChannel || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to send");
        setStatus("error");
        return;
      }

      // Remember channel choice
      if (selectedChannel) {
        localStorage.setItem(LAST_CHANNEL_KEY, selectedChannel);
      }

      const chName = channels.find((c) => c.id === selectedChannel)?.name;
      toast.success(chName ? `Sent to #${chName}` : "Sent to Slack");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  }

  const channelName = channels.find((c) => c.id === selectedChannel)?.name;

  return (
    <div className="flex items-center gap-1.5">
      {/* Channel picker — only shows if channels are available */}
      {!loadingChannels && channels.length > 0 && (
        <Select value={selectedChannel} onValueChange={(v) => setSelectedChannel(v ?? "")}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Channel">
              {channelName ? `#${channelName}` : "Channel"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {channels.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>
                #{ch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleSend}
        disabled={status === "sending" || status === "sent"}
        className="gap-1.5 text-xs h-8"
      >
        {status === "sending" && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === "sent" && <Check className="h-3 w-3 text-emerald-500" />}
        {status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
        {status === "idle" && <MessageSquare className="h-3 w-3" />}
        {status === "sent"
          ? channelName ? `Sent to #${channelName}` : "Sent!"
          : status === "sending" ? "Sending..."
          : "Send to Slack"}
      </Button>
      {status === "error" && (
        <span className="text-[10px] text-red-500">{errorMsg}</span>
      )}
    </div>
  );
}
