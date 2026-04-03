"use client";

import { useCallback, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { SuggestedPrompts } from "./suggested-prompts";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  async function sendMessage(content: string) {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ?? `HTTP ${response.status}`
        );
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Anthropic's toReadableStream() outputs newline-delimited JSON
        // Each line is a complete JSON object (no SSE "data:" prefix)
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // Keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Handle both raw JSON and SSE format
          const jsonStr = trimmed.startsWith("data: ")
            ? trimmed.slice(6)
            : trimmed;
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta" &&
              parsed.delta.text
            ) {
              fullText += parsed.delta.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id
                    ? { ...m, content: fullText }
                    : m
                )
              );
              scrollToBottom();
            }
          } catch {
            // Partial JSON, will be completed in next chunk
          }
        }
      }

      // Ensure final state is set
      if (!fullText) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content:
                    "No response received. Check that ANTHROPIC_API_KEY and GEMINI_API_KEY are set.",
                }
              : m
          )
        );
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: `Error: ${(error as Error).message}. Make sure ANTHROPIC_API_KEY and GEMINI_API_KEY are set in .env.local.`,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      scrollToBottom();
    }
  }

  function resetConversation() {
    setMessages([]);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <SuggestedPrompts onSelect={sendMessage} />
        ) : (
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 pb-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  isStreaming={
                    isStreaming &&
                    message.role === "assistant" &&
                    message.id === messages[messages.length - 1]?.id
                  }
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConversation}
                className="gap-1 text-xs text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                New conversation
              </Button>
            )}
            {messages.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.floor(messages.length / 2)} / 10 turns
              </span>
            )}
          </div>
          <ChatInput onSend={sendMessage} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
